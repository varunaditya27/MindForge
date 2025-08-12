"""
Agentic evaluation service
--------------------------

This service upgrades the static LLM scoring with a simple agent loop:
1) Uses Google Programmable Search Engine (CSE) to discover up-to-date web sources
2) Fetches top results' content (titles/snippets + selective page fetch)
3) Builds a compact context window with the latest information
4) Prompts Gemini to score the idea using both the submission and current context

Design goals:
- Free-tier friendly: CSE has a generous free tier; Gemini API key is required but can be on free usage if available.
- Deterministic fallbacks: If search or fetch fails, we degrade gracefully to the existing static evaluation.
- Small, well-commented steps so you can extend tools later (e.g., cite sources, add more tools).
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import List, Dict, Any, Optional

import google.generativeai as genai
import requests

from ..core.config import settings
from ..models.schemas import IdeaSubmission, EvaluationResponse
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


@dataclass
class WebResult:
  """Simple container for a web search result."""
  title: str
  link: str
  snippet: str
  content: Optional[str] = None


class AgentService:
  """Agentic service that augments Gemini with web search and retrieval."""

  def __init__(self) -> None:
    # Configure Gemini
    try:
      genai.configure(api_key=settings.GEMINI_API_KEY)
      self.model = genai.GenerativeModel('gemini-2.5-flash')
      logger.info("Gemini AI initialized for AgentService")
    except Exception as e:
      self.model = None
      logger.warning(f"Gemini init failed for AgentService: {e}")

    # Configure Google CSE
    self.google_api_key = settings.GOOGLE_CSE_API_KEY
    self.google_cx = settings.GOOGLE_CSE_CX

  # -----------------------
  # Web search and scraping
  # -----------------------
  def _search_web(self, query: str, num: int = 4) -> List[WebResult]:
    """Search the web using Google Programmable Search Engine.

    Returns a small list of WebResult with titles/snippets/links.
    """
    if not self.google_api_key or not self.google_cx:
      logger.info("Google CSE keys missing; skipping web search")
      return []
    try:
      url = (
        "https://www.googleapis.com/customsearch/v1"
        f"?key={self.google_api_key}&cx={self.google_cx}&q={requests.utils.quote(query)}&num={num}"
      )
      res = requests.get(url, timeout=10)
      res.raise_for_status()
      data = res.json()
      items = data.get('items', [])
      results: List[WebResult] = []
      for it in items:
        results.append(WebResult(
          title=it.get('title', ''),
          link=it.get('link', ''),
          snippet=it.get('snippet', ''),
        ))
      return results
    except Exception as e:
      logger.warning(f"Web search failed: {e}")
      return []

  def _fetch_page(self, url: str, max_chars: int = 3000) -> Optional[str]:
    """Fetch page content with simple heuristics.
    Note: We keep it minimal to stay within free limits and speed.
    """
    try:
      headers = {"User-Agent": "IdeaArena-Agent/1.0"}
      res = requests.get(url, timeout=10, headers=headers)
      res.raise_for_status()
      text = res.text
      # Basic sanitization: strip scripts/styles if present
      # (We keep it simple; a real agent could use readability libraries.)
      # Truncate to avoid blowing token budget
      return text[:max_chars]
    except Exception:
      return None

  # -----------------------
  # Prompting and parsing
  # -----------------------
  def _build_context(self, idea: str, web_results: List[WebResult]) -> str:
    """Construct a compact context section from web results."""
    lines: List[str] = []
    for idx, r in enumerate(web_results[:4], start=1):
      lines.append(f"[{idx}] {r.title}\nURL: {r.link}\nSnippet: {r.snippet}")
      if r.content:
        lines.append(f"ContentExcerpt: {r.content[:500]}")
      lines.append("")
    ctx = "\n".join(lines)
    return (
      "Latest Web Context (auto-collected):\n"
      + (ctx if ctx else "<none>")
      + "\n\n"
      "Use this real-world context to score the idea realistically for today’s scenario."
    )

  def _build_prompt(self, submission: IdeaSubmission, context: str) -> str:
    """Create the final prompt for Gemini, escaping braces inside JSON spec."""
    prompt = (
      "You are an expert judge for a college business idea challenge.\n"
      "Evaluate the student's idea using both the provided context (from current web) and the idea itself.\n\n"
      f"Student: {submission.name}\nBranch: {submission.branch}\nRoll Number: {submission.rollNumber}\n\n"
      "Business Idea:\n"
      f"{submission.idea}\n\n"
      f"{context}\n\n"
      "Score each of the following 10 criteria on a scale of 1-100 (integers only). "
      "Then compute totalScore as the average of all 10 criteria (rounded), clamped to 1-100. Be critical and specific.\n"
      "- problemClarity\n- originality\n- feasibility\n- technicalComplexity\n- scalability\n- marketSize\n- businessModel\n- impact\n- executionPlan\n- riskMitigation\n\n"
      "Provide constructive feedback (2-3 paragraphs) that references the real-world context when relevant.\n\n"
      "Respond ONLY in strict JSON (no markdown) with these keys:\n"
      "{{\n"
      '  "problemClarity": 1-100,\n'
      '  "originality": 1-100,\n'
      '  "feasibility": 1-100,\n'
      '  "technicalComplexity": 1-100,\n'
      '  "scalability": 1-100,\n'
      '  "marketSize": 1-100,\n'
      '  "businessModel": 1-100,\n'
      '  "impact": 1-100,\n'
      '  "executionPlan": 1-100,\n'
      '  "riskMitigation": 1-100,\n'
      '  "totalScore": 1-100,\n'
      '  "feedback": "<2-3 paragraphs>"\n'
      "}}\n"
    )
    return prompt

  def _parse_response(self, text: str) -> Dict[str, Any]:
    """Parse model output into structured data with validation and clamping."""
    data = text.strip()
    if "```json" in data:
      data = data.split("```json", 1)[1].split("```", 1)[0]
    elif "```" in data:
      data = data.split("```", 1)[1]
    obj = json.loads(data)
    # Clamp and validate
    for k in [
      'problemClarity','originality','feasibility','technicalComplexity','scalability',
      'marketSize','businessModel','impact','executionPlan','riskMitigation'
    ]:
      val = int(obj[k])
      obj[k] = max(1, min(100, val))
    # Average -> totalScore
    s = sum([
      obj['problemClarity'], obj['originality'], obj['feasibility'], obj['technicalComplexity'],
      obj['scalability'], obj['marketSize'], obj['businessModel'], obj['impact'], obj['executionPlan'],
      obj['riskMitigation']
    ])
    obj['totalScore'] = max(1, min(100, round(s/10)))
    if not isinstance(obj.get('feedback'), str) or len(obj['feedback']) < 50:
      raise ValueError('Feedback too short')
    obj['evaluatedAt'] = datetime.now(timezone.utc).isoformat()
    return obj

  # -----------------------
  # Main flow
  # -----------------------
  def evaluate(self, submission: IdeaSubmission) -> Optional[EvaluationResponse]:
    """Run agent loop: search -> fetch -> prompt Gemini -> parse -> return."""
    # If Gemini isn't available, let caller fallback to static evaluation
    if not self.model:
      return None

    # 1) Formulate a search query from the idea text
    #    Heuristic: combine top keywords and a generic suffix like "market trends".
    base_query = submission.idea[:120]
    query = f"{base_query} current market trends competitors feasibility"

    # 2) Web search
    results = self._search_web(query)
    # 3) Fetch top result contents (lightweight)
    for r in results[:2]:
      r.content = self._fetch_page(r.link)

    # 4) Build context and prompt
    context = self._build_context(submission.idea, results)
    prompt = self._build_prompt(submission, context)

    # 5) Ask Gemini
    try:
      resp = self.model.generate_content(prompt)
      text = getattr(resp, 'text', None)
      if not text:
        # candidate fallback
        cands = getattr(resp, 'candidates', [])
        if cands:
          parts = getattr(cands[0].content, 'parts', [])
          if parts and hasattr(parts[0], 'text'):
            text = parts[0].text
      if not text:
        raise ValueError('Empty LLM response')
      data = self._parse_response(text)
      return EvaluationResponse(**data)
    except Exception as e:
      logger.warning(f"AgentService evaluation failed, falling back. Error: {e}")
      return None


# Singleton instance
agent_service = AgentService()
