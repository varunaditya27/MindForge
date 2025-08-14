"""Asynchronous evaluation queue (in-process load manager).

Provides an optional path to enqueue idea evaluations instead of performing
the Gemini call inline with the HTTP request. This helps smooth bursts and
reduce the chance of triggering per-minute rate limits across keys.

Design:
  - In-memory only (resets on restart) – acceptable for live event day.
  - Single worker coroutine consumes an asyncio.Queue.
  - Each job stored in a dict by UUID with status transitions:
      pending -> processing -> done | error
  - Processing attempts agentic evaluation first, then static AI, mirroring
    synchronous endpoint behavior.
  - Leaderboard + profile updates occur only after a successful evaluation.

Limitations:
  - Loss of jobs on server restart.
  - No persistence / retry scheduling.
  - Sequential worker (can be extended to small parallelism if needed).

For larger scale or persistence needs, migrate to Redis / Cloud Tasks.
"""

from __future__ import annotations

import asyncio
import uuid
import logging
from dataclasses import dataclass
from typing import Dict, Optional

from ..models.schemas import IdeaSubmission, EvaluationResponse
from .agent_service import agent_service
from .ai_service import ai_service
from .firebase_service import firebase_service

logger = logging.getLogger(__name__)


@dataclass
class EvalJob:
    id: str
    submission: IdeaSubmission
    status: str = "pending"  # pending|processing|done|error
    result: Optional[EvaluationResponse] = None
    error: Optional[str] = None


class EvaluationQueue:
    def __init__(self) -> None:
        self._queue: asyncio.Queue[EvalJob] = asyncio.Queue()
        self._jobs: Dict[str, EvalJob] = {}
        self._lock = asyncio.Lock()
        self._worker_task: Optional[asyncio.Task] = None
        self._shutdown = asyncio.Event()

    def start(self) -> None:
        if self._worker_task is None:
            self._worker_task = asyncio.create_task(self._worker_loop())
            logger.info("EvaluationQueue worker started")

    async def stop(self) -> None:
        self._shutdown.set()
        if self._worker_task:
            await self._worker_task
            logger.info("EvaluationQueue worker stopped")

    async def enqueue(self, submission: IdeaSubmission) -> str:
        job_id = str(uuid.uuid4())
        job = EvalJob(id=job_id, submission=submission)
        async with self._lock:
            self._jobs[job_id] = job
        await self._queue.put(job)
        return job_id

    async def get_status(self, job_id: str) -> Optional[dict]:
        async with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return None
            data = {
                "id": job.id,
                "status": job.status,
                "error": job.error,
            }
            if job.result:
                data["result"] = job.result.model_dump()
            return data

    async def _worker_loop(self) -> None:
        while not self._shutdown.is_set():
            try:
                job = await asyncio.wait_for(self._queue.get(), timeout=0.5)
            except asyncio.TimeoutError:
                continue
            try:
                await self._process_job(job)
            finally:
                self._queue.task_done()

    async def _process_job(self, job: EvalJob) -> None:
        async with self._lock:
            job.status = "processing"
        logger.info(f"Processing evaluation job {job.id} for {job.submission.uid}")
        try:
            # Agentic first
            result = agent_service.evaluate(job.submission)
            if not result:
                result = ai_service.evaluate_idea(job.submission)
            if not result:
                raise RuntimeError("All evaluation strategies failed")

            # Persist user idea and leaderboard (mirrors synchronous path)
            try:
                firebase_service.save_user_idea(job.submission.uid, {
                    'round': '1',
                    'idea': job.submission.idea,
                })
            except Exception:  # noqa: BLE001
                pass

            # Update leaderboard & profile (totalScore already computed from 5 metrics)
            try:
                firebase_service.update_leaderboard(job.submission.uid, {
                    'name': job.submission.name,
                    'branch': job.submission.branch,
                    'score': result.totalScore,
                })
            except Exception:  # noqa: BLE001
                pass
            try:
                existing = firebase_service.get_user_profile(job.submission.uid) or {}
                prev_best = existing.get('personalBestScore')
                personal_best = max(prev_best or 0, result.totalScore)
                firebase_service.upsert_user_profile(job.submission.uid, {
                    'uid': job.submission.uid,
                    'name': job.submission.name,
                    'branch': job.submission.branch,
                    'rollNumber': job.submission.rollNumber,
                    'lastEvaluation': result.model_dump(),
                    'hasSubmitted': True,
                    'personalBestScore': personal_best,
                })
            except Exception:  # noqa: BLE001
                pass

            async with self._lock:
                job.result = result
                job.status = "done"
        except Exception as e:  # noqa: BLE001
            logger.error(f"Evaluation job {job.id} failed: {e}")
            async with self._lock:
                job.status = "error"
                job.error = str(e)


# Singleton instance
evaluation_queue = EvaluationQueue()
