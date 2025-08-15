import google.generativeai as genai
import json
import logging
import time
from typing import Dict, Any, Optional
from ..core.config import settings
from ..models.schemas import IdeaSubmission, EvaluationResponse
from datetime import datetime, timezone
from .gemini_client import GeminiMultiKeyClient

logger = logging.getLogger(__name__)

class AIService:
    """Service for AI-powered idea evaluation using Gemini"""
    
    def __init__(self):
        self._initialize_genai()
    
    def _initialize_genai(self) -> None:
        """Initialize Google Generative AI (multi-key if provided)."""
        try:
            if settings.GEMINI_API_KEYS:
                self.multi_client = GeminiMultiKeyClient(settings.GEMINI_API_KEYS, 'gemini-2.5-flash')
                self.model = None
                logger.info("AIService using GeminiMultiKeyClient (round-robin keys)")
            else:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                # Prefer a current, fast model for structured JSON output
                self.model = genai.GenerativeModel('gemini-2.5-flash')
                self.multi_client = None
                logger.info("Gemini AI initialized successfully (single key)")
        except Exception as e:
            # Don't crash the app if AI init fails; allow fallback in evaluate_idea
            self.model = None
            self.multi_client = None
            logger.warning(f"Gemini AI initialization failed; using fallback evaluation. Error: {e}")
    
    def _create_evaluation_prompt(self, submission: IdeaSubmission) -> str:
        # Expanded, highly instructive rubric-driven system prompt.
        # NOTE: The downstream parser expects ONLY the 5 numeric criteria + feedback.
        # The model MUST NOT add a totalScore or any extra fields.
        return (
            "You are MindForge Evaluator, an impartial judge for short (~50-word) creative AI idea pitches from college freshmen. "
            "Return ONLY raw JSON (no Markdown fence, no commentary before/after). Do NOT include a total or any extra keys.\n\n"
            "IDENTITY & SCOPE\n"
            "- Be concise, analytical, and consistent with the rubric below.\n"
            "- Never hallucinate facts or statistics; if uncertain, evaluate based on the text quality itself.\n\n"
            f"SUBMISSION METADATA\nStudent: {submission.name}\nBranch: {submission.branch}\nRoll Number: {submission.rollNumber}\n\n"
            f"PITCH (verbatim user text):\n{submission.idea}\n\n"
            "RUBRIC (0–100 integers, evaluate EACH independently; DO NOT average or compute total):\n"
            "aiRelevance & Applicability:\n"
            "  0–39  AI absent / irrelevant / implausible.\n"
            "  40–69 AI role present but generic OR partially impractical.\n"
            "  70–89 AI is central, plausible with current tech.\n"
            "  90–100 AI is core, technically sound, well-integrated.\n"
            "creativity & Originality:\n"
            "  0–39  Generic / overused pattern.\n"
            "  40–69 Some novelty but predictable.\n"
            "  70–89 Fresh twist; clever adaptation.\n"
            "  90–100 Highly original; unexpected yet sensible.\n"
            "impact (Real-World Benefit):\n"
            "  0–39  No clear benefit / audience.\n"
            "  40–69 Limited or niche value.\n"
            "  70–89 Significant benefit for a defined group/sector.\n"
            "  90–100 Major potential impact; timely / relevant.\n"
            "clarity & Presentation (target length ~50 words):\n"
            "  0–39  Confusing or incoherent.\n"
            "  40–69 Understandable but incomplete / awkward.\n"
            "  70–89 Clear problem + AI role + outcome.\n"
            "  90–100 Crisp, engaging, plain language.\n"
            "funFactor (Delight / Wow):\n"
            "  0–39  Forgettable.\n"
            "  40–69 Mildly interesting.\n"
            "  70–89 Memorable & engaging.\n"
            "  90–100 Standout; sparks excitement.\n\n"
            "FEEDBACK REQUIREMENTS\n"
            "- Provide a single string 50–800 chars.\n"
            "- Structure: (a) Strengths / what's working; (b) Specific improvements / next step.\n"
            "- Be actionable (avoid generic 'be more innovative').\n"
            "- Avoid repeating the pitch verbatim; summarise.\n\n"
            "OUTPUT FORMAT (STRICT JSON ONLY — NO MARKDOWN):\n"
            "{\n  \"aiRelevance\": <0-100>,\n  \"creativity\": <0-100>,\n  \"impact\": <0-100>,\n  \"clarity\": <0-100>,\n  \"funFactor\": <0-100>,\n  \"feedback\": \"<50-800 chars>\"\n}\n"
            "RULES\n"
            "- No backticks, no trailing commas, no additional keys.\n"
            "- All scores MUST be integers.\n"
            "- Do NOT include explanations outside JSON.\n"
        )

    @staticmethod
    def _extract_text_single(response) -> Optional[str]:
        """Extract text from single-key response variants."""
        text = getattr(response, "text", None)
        if text:
            return text
        try:
            candidates = getattr(response, "candidates", [])
            if candidates:
                parts = getattr(candidates[0].content, "parts", [])
                if parts and hasattr(parts[0], "text"):
                    return parts[0].text
        except Exception:
            return None
        return None

    @staticmethod
    def _fallback_synthetic(submission: IdeaSubmission) -> EvaluationResponse:
        idea_len = len(submission.idea or '')
        base = max(15, min(70, idea_len // 25 + 15))
        def clamp(v):
            return max(0, min(100, v))
        ai_rel = clamp(base + (idea_len % 7) - 3)
        creativity = clamp(base + (idea_len % 11) - 5)
        impact = clamp(base + (idea_len % 13) - 4)
        clarity = clamp(base + (idea_len % 5) - 2)
        fun = clamp(base + (idea_len % 9) - 4)
        total = clamp(round((ai_rel + creativity + impact + clarity + fun)/5))
        feedback_text = "Synthetic fallback: refine specificity, highlight AI differentiator, and quantify who benefits to improve impact & clarity."
        return EvaluationResponse(
            aiRelevance=ai_rel,
            creativity=creativity,
            impact=impact,
            clarity=clarity,
            funFactor=fun,
            totalScore=total,
            feedback=feedback_text,
            evaluatedAt=datetime.now(timezone.utc).isoformat(),
        )
    
    def _parse_ai_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse and validate AI response
        
        Args:
            response_text: Raw response from AI
            
        Returns:
            dict: Parsed evaluation data
            
        Raises:
            ValueError: If response cannot be parsed or is invalid
        """
        try:
            # Clean the response text
            evaluation_text = response_text.strip()
            
            # Handle markdown formatting
            if "```json" in evaluation_text:
                evaluation_text = evaluation_text.split("```json")[1].split("```")[0]
            elif "```" in evaluation_text:
                evaluation_text = evaluation_text.split("```")[1]
            
            # Parse JSON
            evaluation_data = json.loads(evaluation_text.strip())
            
            # Validate required fields
            required_fields = [
                'aiRelevance','creativity','impact','clarity','funFactor','feedback'
            ]
            for field in required_fields:
                if field not in evaluation_data:
                    raise ValueError(f"Missing required field: {field}")
            
            # Validate score ranges for all criteria (1-100)
            for score_field in [
                'aiRelevance','creativity','impact','clarity','funFactor'
            ]:
                score_raw = evaluation_data[score_field]
                try:
                    score = int(score_raw)
                except Exception:
                    raise ValueError(f"Invalid score for {score_field}: {score_raw}")
                # Clamp to valid bounds
                score = max(1, min(100, score))
                evaluation_data[score_field] = score
            
            # Calculate and validate total score (average of criteria)
            total_sum = sum([
                evaluation_data['aiRelevance'], evaluation_data['creativity'], evaluation_data['impact'],
                evaluation_data['clarity'], evaluation_data['funFactor']
            ])
            total_score = round(total_sum / 5)
            total_score = max(1, min(100, total_score))
            evaluation_data['totalScore'] = total_score
            
            # Validate feedback
            if not isinstance(evaluation_data['feedback'], str) or len(evaluation_data['feedback']) < 50:
                raise ValueError("Feedback must be a string with at least 50 characters")
            
            # Add evaluatedAt timestamp
            evaluation_data['evaluatedAt'] = datetime.now(timezone.utc).isoformat()

            return evaluation_data

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            raise ValueError("Invalid JSON response from AI")
        except Exception as e:
            logger.error(f"Error parsing AI response: {e}")
            raise ValueError(f"Failed to parse AI response: {str(e)}")
    
    def evaluate_idea(self, submission: IdeaSubmission) -> Optional[EvaluationResponse]:
        """
        Evaluate a business idea using AI
        
        Args:
            submission: The idea submission to evaluate
            
        Returns:
            EvaluationResponse: The evaluation results or None if failed
        """
        try:
            t0 = time.perf_counter()
            idea_preview = (submission.idea[:140] + '…') if len(submission.idea) > 140 else submission.idea
            logger.info(
                "ai_eval.start uid=%s name=%s idea_chars=%d preview=%r multi_client=%s",
                submission.uid,
                submission.name,
                len(submission.idea),
                idea_preview,
                bool(getattr(self, 'multi_client', None)),
            )

            # Create prompt
            prompt = self._create_evaluation_prompt(submission)
            logger.debug(
                "ai_eval.prompt uid=%s prompt_chars=%d prompt_first_line=%r", submission.uid, len(prompt), prompt.splitlines()[0][:120]
            )

            # Get AI response (use multi-key if available)
            if getattr(self, 'multi_client', None):
                response = self.multi_client.generate(prompt)
                text = self.multi_client.extract_text(response)
            else:
                if not getattr(self, 'model', None):
                    raise RuntimeError("AI model not initialized")
                response = self.model.generate_content(prompt)
                text = self._extract_text_single(response)
            if not text:
                raise ValueError("Empty response from AI")
            logger.debug(
                "ai_eval.response_raw uid=%s chars=%d head=%r", submission.uid, len(text), text[:180].replace('\n',' ') + ("…" if len(text) > 180 else "")
            )

            # Parse response
            evaluation_data = self._parse_ai_response(text)

            # Create response model
            evaluation_response = EvaluationResponse(**evaluation_data)

            elapsed_ms = (time.perf_counter() - t0) * 1000
            logger.info(
                "ai_eval.success uid=%s score=%d elapsed_ms=%.1f feedback_chars=%d",
                submission.uid,
                evaluation_response.totalScore,
                elapsed_ms,
                len(evaluation_response.feedback),
            )
            return evaluation_response

        except Exception as e:
            logger.warning(
                "ai_eval.failure uid=%s error=%s -> using synthetic fallback", submission.uid, e
            )
            fallback = self._fallback_synthetic(submission)
            logger.info(
                "ai_eval.fallback uid=%s synthetic_score=%d", submission.uid, fallback.totalScore
            )
            return fallback

# Create singleton instance
ai_service = AIService()
