from fastapi import APIRouter, HTTPException
import logging
from ..models.schemas import IdeaSubmission, EvaluationResponse
from ..services import ai_service, firebase_service
from ..services.agent_service import agent_service
from ..services.evaluation_queue import evaluation_queue
from fastapi import BackgroundTasks
from typing import Dict, Any

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ideas", tags=["ideas"])

# -----------------------
# Queue-based async evaluation endpoints (primary submission path)
# -----------------------

@router.post("/submit_async", response_model=Dict[str, Any])
async def submit_idea_async(submission: IdeaSubmission):
    """Enqueue an idea for background evaluation.

    Returns a jobId that the client can poll via /ideas/status/{job_id}.
    """
    # Duplicate submission guard (same as sync path)
    try:
        existing_profile = firebase_service.get_user_profile(submission.uid) or {}
    except Exception:
        existing_profile = {}
    if existing_profile.get("hasSubmitted"):
        raise HTTPException(status_code=400, detail="Already submitted")

    # Start queue worker if not running
    evaluation_queue.start()
    job_id = await evaluation_queue.enqueue(submission)
    return {"jobId": job_id, "status": "queued"}


@router.get("/status/{job_id}", response_model=Dict[str, Any])
async def get_job_status(job_id: str):
    data = await evaluation_queue.get_status(job_id)
    if not data:
        raise HTTPException(status_code=404, detail="Job not found")
    return data
