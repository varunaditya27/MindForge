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
from typing import List, Dict, Any, Optional, Tuple, Set

import google.generativeai as genai
import requests

from ..core.config import settings
from ..models.schemas import IdeaSubmission, EvaluationResponse
from datetime import datetime, timezone
from .gemini_client import GeminiMultiKeyClient

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
    # Prefer multi-key rotation if provided, else fall back to single key model
    self.multi_client: Optional[GeminiMultiKeyClient] = None
    try:
      if settings.GEMINI_API_KEYS:
        self.multi_client = GeminiMultiKeyClient(settings.GEMINI_API_KEYS, 'gemini-2.5-flash')
        self.model = None
        logger.info("AgentService using GeminiMultiKeyClient (round-robin keys)")
      else:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        logger.info("Gemini AI initialized for AgentService (single key)")
    except Exception as e:
      self.model = None
      self.multi_client = None
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
      headers = {"User-Agent": "MindForge-Agent/1.0"}
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
  # Advanced retrieval helpers (multi-query + scoring)
  # -----------------------
  def _extract_core_terms(self, text: str, max_terms: int = 6) -> List[str]:
    """Heuristically extract salient terms (naive noun-like token filter).

    We purposely keep this logic lightweight & deterministic (no extra LLM call)
    so that under heavy event load we avoid extra latency & cost.
    """
    # Basic tokenization / filtering
    raw_tokens = [t.strip('.,:;()[]{}!?'"'\n\r\t") for t in text.split()]  # noqa: B950
    stop: Set[str] = {
      'the','a','an','and','or','for','with','using','use','to','of','in','on','by','from','this','that','ai','ml','data',
      'we','our','it','its','is','are','be','as','at','into','via','will','can','users','user','app','platform'
    }
    candidates: List[str] = []
    for tok in raw_tokens:
      tok_low = tok.lower()
      if len(tok_low) < 4 or tok_low in stop:
        continue
      if not tok_low.isalnum():
        continue
      if tok_low not in candidates:
        candidates.append(tok_low)
      if len(candidates) >= max_terms:
        break
    return candidates

  def _infer_domain(self, terms: List[str]) -> Optional[str]:
    """Very light domain inference to tailor supplemental queries."""
    domain_map = {
      'health': ['health','medical','clinic','patient','hospital','wellness','diagnosis','disease'],
      'education': ['learn','student','class','school','education','tutor','university'],
      'finance': ['bank','finance','trading','investment','loan','credit','stock','fintech','payment'],
      'agriculture': ['crop','farm','soil','agri','agriculture','farmer','yield'],
      'environment': ['climate','carbon','emission','green','sustain','ecology','environment','recycle'],
      'retail': ['retail','ecommerce','shopping','buyer','seller','merchant','inventory'],
      'social': ['community','social','connect','network','share','friends'],
      'mobility': ['transport','logistic','delivery','route','traffic','fleet','mobility']
    }
    for domain, keys in domain_map.items():
      for t in terms:
        if any(k in t for k in keys):
          return domain
    return None

  def _generate_query_variants(self, base_query: str, core_terms: List[str], domain: Optional[str]) -> List[str]:
    """Produce a diversified small set of queries to broaden coverage.

    Strategy:
      - Base idea text + generic evaluation tags (already handled upstream by _build_base_query)
      - Domain-specific angle (regulation / adoption / trends) if domain detected
      - Feasibility & competitors queries using top 1-2 core terms
    """
    queries: List[str] = [base_query]
    primary_terms = core_terms[:2]
    if primary_terms:
      queries.append(" ".join(primary_terms) + " AI market trends 2025")
      queries.append(" ".join(primary_terms) + " AI competitors platforms")
      queries.append(" ".join(primary_terms) + " AI feasibility challenges")
    if domain:
      queries.append(f"AI {domain} regulation 2025")
      queries.append(f"AI {domain} adoption current challenges")
    # Deduplicate while preserving order
    seen: Set[str] = set()
    deduped: List[str] = []
    for q in queries:
      qn = q.strip()
      if qn and qn.lower() not in seen:
        deduped.append(qn)
        seen.add(qn.lower())
    return deduped[:6]

  def _aggregate_search(self, queries: List[str], per_query: int = 4, global_cap: int = 14) -> List[WebResult]:
    """Run multiple small searches and merge results with light scoring for diversity.

    We emphasize breadth (different domains / angles) instead of deep duplication.
    """
    all_results: List[Tuple[WebResult, str]] = []  # (result, originating_query)
    for q in queries:
      results = self._search_web(q, num=per_query)
      for r in results:
        all_results.append((r, q))
    # Score results: prefer unique hosts & earlier queries
    scored: List[Tuple[float, WebResult]] = []
    seen_links: Set[str] = set()
    seen_hosts: Set[str] = set()
    for rank, (res, origin) in enumerate(all_results):
      if res.link in seen_links:
        continue
      seen_links.add(res.link)
      host = ''
      try:
        host = res.link.split('/')[2]
      except Exception:  # noqa: BLE001
        host = res.link
      diversity_bonus = 1.0 if host not in seen_hosts else 0.6
      if host not in seen_hosts:
        seen_hosts.add(host)
      # Earlier queries a bit more weight; snippet length provides minor signal
      base_score = max(0.1, 1.0 - (rank * 0.015))
      snippet_factor = min(1.0, len(res.snippet)/180)
      score = base_score * diversity_bonus + 0.2 * snippet_factor
      scored.append((score, res))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [r for _, r in scored[:global_cap]]

  def _lightweight_content_select(self, html: str, max_len: int = 900) -> str:
    """Very small heuristic to extract a pseudo-summary from raw HTML/text.

    - Strips obvious script/style blocks
    - Splits into sentences and keeps first ones containing target keywords
    The goal: shrink noise while retaining feasibility / trend signals.
    """
    lowered = html.lower()
    # Remove script/style crude blocks
    for tag in ('<script', '<style'):
      if tag in lowered:
        # naive truncation at first occurrence
        idx = lowered.find(tag)
        html = html[:idx]
    # Sentence split (very naive)
    sentences = [s.strip() for s in html.replace('\n', ' ').split('.') if len(s.strip()) > 40]
    keywords = {'ai','artificial','market','trend','adoption','challenge','regulation','risk','feasibility','startup','user','growth'}
    picked: List[str] = []
    for s in sentences:
      if any(k in s.lower() for k in keywords):
        picked.append(s)
      if len(picked) >= 5:
        break
    if not picked:
      picked = sentences[:3]
    summary = '. '.join(picked)[:max_len]
    return summary

  def _enrich_results_with_content(self, results: List[WebResult], fetch_limit: int = 5) -> None:
    """Fetch & summarize a subset of pages to add richer grounding snippets."""
    for r in results[:fetch_limit]:
      raw = self._fetch_page(r.link, max_chars=4000)
      if raw:
        try:
          r.content = self._lightweight_content_select(raw)
        except Exception:  # noqa: BLE001
          r.content = raw[:800]

  # -----------------------
  # Prompting and parsing
  # -----------------------
  def _build_context(self, web_results: List[WebResult]) -> str:
    """Construct a JSON-like context bundle for the new system prompt.

    We serialize a lightweight array of objects. The prompt will instruct the
    model to treat this as read-only signals (NOT to copy verbatim).
    """
    bundle: List[Dict[str, Any]] = []
    for idx, r in enumerate(web_results[:5], start=1):
      entry: Dict[str, Any] = {
        "id": idx,
        "title": r.title[:140],
        "url": r.link,
        "snippet": r.snippet[:300]
      }
      if r.content:
        entry["content_excerpt"] = (r.content[:600])
      bundle.append(entry)
    return (
      "context_bundle = " + json.dumps(bundle, ensure_ascii=False) + "\n"
      "If context_bundle is empty, rely on general knowledge but DO NOT hallucinate unknown current statistics.\n"
    )

  def _build_prompt(self, submission: IdeaSubmission, context: str) -> str:
    """Compose the updated 2025 system prompt with the new 5 criteria.

    We still later back-fill legacy 10 metrics internally for compatibility,
    but the model only returns the new 5 to minimise drift / instruction load.
    """
    return (
      "SYSTEM ROLE\n"
  "You are MindForge Evaluator, an impartial, context-aware judge for short (~50-word) creative AI idea pitches from college freshmen. "
      "Your sole output is strict JSON with exactly six keys: aiRelevance, creativity, impact, clarity, funFactor, feedback. No additional commentary.\n\n"
      "CONTEXT HANDLING\n"
      "You may receive context_bundle containing brief, recent web snippets (lightweight search grounding).\n"
      "- Use it ONLY to assess timeliness, feasibility, originality signals, or market alignment.\n"
      "- If context_bundle is empty or sparse: fallback to general knowledge cautiously; NEVER hallucinate statistics or specific market sizes.\n"
      "- Do NOT copy long passages—condense signals.\n\n"
      f"SUBMISSION METADATA\nStudent: {submission.name}\nBranch: {submission.branch}\nRoll Number: {submission.rollNumber}\n\n"
      "PITCH (verbatim):\n" + submission.idea + "\n\n" +
      context + "\n"
      "SCORING CRITERIA (0–100 integers each, evaluated INDEPENDENTLY; DO NOT average or compute a total):\n"
      "aiRelevance & Applicability:\n"
      "  0–39  AI irrelevant / vague / implausible.\n"
      "  40–69 Clear but generic or partially impractical.\n"
      "  70–89 Central & plausible with current tech.\n"
      "  90–100 Core, technically sound, well-integrated.\n"
      "creativity & Originality:\n"
      "  0–39 Generic / overused.\n"
      "  40–69 Some novelty; predictable.\n"
      "  70–89 Fresh twist; clever adaptation.\n"
      "  90–100 Highly original; unexpected yet sensible.\n"
      "impact (Real-World Benefit):\n"
      "  0–39 No clear benefit / audience.\n"
      "  40–69 Limited or niche benefit.\n"
      "  70–89 Significant benefit for a defined group/sector.\n"
      "  90–100 Major potential impact; timely & relevant (context supports).\n"
      "clarity & Presentation (target ~50 words):\n"
      "  0–39 Confusing / incoherent.\n"
      "  40–69 Understandable but incomplete / awkward.\n"
      "  70–89 Clear problem + AI role + outcome.\n"
      "  90–100 Crisp, engaging, plain language.\n"
      "funFactor (Delight / Wow):\n"
      "  0–39 Forgettable.\n"
      "  40–69 Mildly interesting.\n"
      "  70–89 Memorable & engaging.\n"
      "  90–100 Standout; sparks excitement.\n\n"
      "FEEDBACK REQUIREMENTS\n"
      "- Single JSON string field (feedback) length 50–800 chars.\n"
      "- Structure: (a) Strengths; (b) Specific improvements / next step.\n"
      "- Be concrete (avoid 'improve scalability' without saying HOW).\n"
      "- No bullet characters; use sentences.\n"
      "- Do not reference score numbers explicitly.\n\n"
      "OUTPUT FORMAT (STRICT JSON ONLY — NO MARKDOWN, NO EXTRA KEYS):\n"
      "{\n  \"aiRelevance\": <0-100>,\n  \"creativity\": <0-100>,\n  \"impact\": <0-100>,\n  \"clarity\": <0-100>,\n  \"funFactor\": <0-100>,\n  \"feedback\": \"<50-800 chars>\"\n}\n"
      "RULES\n"
      "- All scores MUST be integers, no quotes.\n"
      "- No trailing commas.\n"
      "- Do NOT add fields (e.g., total, reasoning, confidence).\n"
      "- If pitch severely lacks info, still score (low) and state the missing elements in feedback.\n"
    )

  def _parse_response(self, text: str) -> Dict[str, Any]:
    """Parse new-format JSON (aiRelevance, creativity, impact, clarity, funFactor, feedback)."""
    raw = text.strip()
    if "```json" in raw:
      raw = raw.split("```json", 1)[1].split("```", 1)[0]
    elif "```" in raw:
      raw = raw.split("```", 1)[1]
    obj = json.loads(raw)
    required = ["aiRelevance","creativity","impact","clarity","funFactor","feedback"]
    for k in required:
      if k not in obj:
        raise ValueError(f"Missing key {k}")
    def clamp(v: Any) -> int:
      return max(0, min(100, int(v)))
    ai_rel = clamp(obj['aiRelevance'])
    creativity = clamp(obj['creativity'])
    impact = clamp(obj['impact'])
    clarity = clamp(obj['clarity'])
    fun = clamp(obj['funFactor'])
    feedback = obj.get('feedback','') or ''
    if len(feedback) < 50:
      raise ValueError('Feedback too short')
    total = max(0, min(100, round((ai_rel + creativity + impact + clarity + fun)/5)))
    return {
      'aiRelevance': ai_rel,
      'creativity': creativity,
      'impact': impact,
      'clarity': clarity,
      'funFactor': fun,
      'totalScore': total,
      'feedback': feedback,
      'evaluatedAt': datetime.now(timezone.utc).isoformat()
    }
  
  # -----------------------
  # Main flow
  # -----------------------
  def _prepare_prompt_with_context(self, submission: IdeaSubmission) -> str:
    """Build a richer web-augmented prompt.

    New multi-stage retrieval pipeline (cheap & parallel-friendly):
      1. Heuristic term extraction -> core conceptual tokens.
      2. Domain inference -> optional domain context queries.
      3. Generate diversified query variants (market, competitors, feasibility, regulation, adoption).
      4. Run small fan-out searches (each limited) and merge results.
      5. Score + select top diverse links (host diversity + snippet utility).
      6. Fetch & summarize subset of pages (light heuristic summarizer) to reduce noise.
      7. Build structured context_bundle consumed by the evaluation prompt.
    If *any* stage fails or keys missing -> gracefully degrade to minimal original base query search.
    """
    if not (self.google_api_key and self.google_cx):
      # No search capability -> empty context
      return self._build_prompt(submission, "context_bundle = []\n")

    try:
      base_query = self._build_base_query(submission)
      core_terms = self._extract_core_terms(submission.idea)
      domain = self._infer_domain(core_terms)
      query_variants = self._generate_query_variants(base_query, core_terms, domain)
      merged_results = self._aggregate_search(query_variants)
      self._enrich_results_with_content(merged_results, fetch_limit=5)
      context = self._build_context(merged_results)
      return self._build_prompt(submission, context)
    except Exception as e:  # noqa: BLE001
      logger.warning(f"Context enrichment failed; using fallback simple search. Error: {e}")
      # Fallback: single-step basic search (previous simpler path)
      base_query = self._build_base_query(submission)
      initial_results = self._search_web(base_query)
      self._fetch_top_contents(initial_results, limit=3)
      context = self._build_context(initial_results)
      return self._build_prompt(submission, context)

  def _build_base_query(self, submission: IdeaSubmission) -> str:
    seed_terms = ["market trends", "competitors", "feasibility", "customer adoption"]
    return f"{submission.idea[:160].replace('\n',' ')} {' '.join(seed_terms)}"

  def _maybe_refine_and_merge(self, base_query: str, initial: List[WebResult]) -> List[WebResult]:
    if not initial:
      return []
    joined_snips = " ".join(r.snippet for r in initial[:3])[:300]
    tokens: List[str] = []
    for t in joined_snips.split():
      t_clean = ''.join(ch for ch in t.lower() if ch.isalnum())
      if len(t_clean) > 4 and t_clean not in tokens:
        tokens.append(t_clean)
      if len(tokens) >= 4:
        break
    if not tokens:
      return initial
    refined_query = base_query + " " + " ".join(tokens[:4])
    refined = self._search_web(refined_query)
    link_seen = set()
    merged: List[WebResult] = []
    for r in (initial + refined):
      if r.link and r.link not in link_seen:
        link_seen.add(r.link)
        merged.append(r)
    return merged

  def _fetch_top_contents(self, results: List[WebResult], limit: int = 3) -> None:
    for r in results[:limit]:
      r.content = self._fetch_page(r.link)

  def _extract_json_segment(self, text: str) -> str:
    if 'JSON_RESPONSE:' in text:
      segment = text.split('JSON_RESPONSE:',1)[1]
      if 'END_JSON_RESPONSE' in segment:
        segment = segment.split('END_JSON_RESPONSE',1)[0]
      return segment.strip()
    return text

  def evaluate(self, submission: IdeaSubmission) -> Optional[EvaluationResponse]:
    """Run agent loop: search -> fetch -> prompt Gemini -> parse -> return.

    Returns None if neither single nor multi client is available so caller can fallback.
    """
    if not (self.model or self.multi_client):
      return None

    prompt = self._prepare_prompt_with_context(submission)
    analysis_prompt = self._compose_analysis_prompt(prompt)

    try:
      text = self._generate_text(analysis_prompt)
      if not text:
        raise ValueError("Empty LLM response")
      json_payload = self._extract_json_segment(text)
      data = self._parse_response(json_payload)
      return EvaluationResponse(**data)
    except Exception as e:
      logger.warning(f"AgentService evaluation failed, falling back. Error: {e}")
      return None

  # -----------------------
  # Internal helpers (generation)
  # -----------------------
  def _compose_analysis_prompt(self, base_prompt: str) -> str:
    # Retain an internal ANALYSIS phase for reasoning transparency while keeping
    # final JSON minimal. The parser strips wrapper markers.
    return (
      base_prompt +
      "\nThink briefly before answering. Return exactly two blocks in order:\n"
      "ANALYSIS:\n<bullet list of 3-7 grounded insight bullets WITHOUT referencing source ids if used like [1],[2]>\nEND_ANALYSIS\n"
      "JSON_RESPONSE:\n<ONLY the specified JSON schema with 5 keys + feedback>\nEND_JSON_RESPONSE"
    )

  def _generate_text(self, prompt: str) -> Optional[str]:
    if self.multi_client:
      resp = self.multi_client.generate(prompt)
      return self.multi_client.extract_text(resp)
    # single-key path
    resp = self.model.generate_content(prompt)  # type: ignore[union-attr]
    text = getattr(resp, 'text', None)
    if text:
      return text
    try:
      candidates = getattr(resp, 'candidates', [])
      if candidates:
        parts = getattr(candidates[0].content, 'parts', [])
        if parts and hasattr(parts[0], 'text'):
          return parts[0].text
    except Exception:  # noqa: BLE001
      return None
    return None


# Singleton instance
agent_service = AgentService()
