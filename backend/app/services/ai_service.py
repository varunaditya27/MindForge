import google.generativeai as genai
import json
import logging
from typing import Dict, Any, Optional
from ..core.config import settings
from ..models.schemas import IdeaSubmission, EvaluationResponse
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class AIService:
    """Service for AI-powered idea evaluation using Gemini"""
    
    def __init__(self):
        self._initialize_genai()
    
    def _initialize_genai(self) -> None:
        """Initialize Google Generative AI"""
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            # Prefer a current, fast model for structured JSON output
            self.model = genai.GenerativeModel('gemini-2.5-flash')
            logger.info("Gemini AI initialized successfully")
        except Exception as e:
            # Don't crash the app if AI init fails; allow fallback in evaluate_idea
            self.model = None
            logger.warning(f"Gemini AI initialization failed; using fallback evaluation. Error: {e}")
    
    def _create_evaluation_prompt(self, submission: IdeaSubmission) -> str:
        """
        Create a structured prompt for idea evaluation
        """
        prompt = (
            "Evaluate the following business idea submitted by a college student for a coding event.\n\n"
            f"Student: {submission.name}\n"
            f"Branch: {submission.branch}\n"
            f"Roll Number: {submission.rollNumber}\n\n"
            "Business Idea:\n"
            f"{submission.idea}\n\n"
            "Score each of the following 10 criteria on a scale of 1-100 (integers only). "
            "Then compute totalScore as the average of all 10 criteria (rounded to nearest integer), "
            "clamped to 1-100. Be critical and specific:\n"
            "- problemClarity: How clear and specific is the problem definition?\n"
            "- originality: How novel and differentiated is the idea?\n"
            "- feasibility: Is the solution technically and practically feasible?\n"
            "- technicalComplexity: Depth and rigor of the proposed technical approach.\n"
            "- scalability: Ability to scale to more users/markets.\n"
            "- marketSize: Size and accessibility of the target market.\n"
            "- businessModel: Clarity and viability of monetization.\n"
            "- impact: Expected user/societal impact.\n"
            "- executionPlan: Realism of roadmap and MVP readiness.\n"
            "- riskMitigation: Awareness and mitigation of key risks.\n\n"
            "Provide constructive feedback (2-3 paragraphs) covering strengths, specific weaknesses, and concrete next steps.\n\n"
            "Respond ONLY in strict JSON (no markdown), with these exact keys (all integers 1-100):\n"
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
                'problemClarity','originality','feasibility','technicalComplexity','scalability',
                'marketSize','businessModel','impact','executionPlan','riskMitigation','feedback'
            ]
            for field in required_fields:
                if field not in evaluation_data:
                    raise ValueError(f"Missing required field: {field}")
            
            # Validate score ranges for all criteria (1-100)
            for score_field in [
                'problemClarity','originality','feasibility','technicalComplexity','scalability',
                'marketSize','businessModel','impact','executionPlan','riskMitigation'
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
                evaluation_data['problemClarity'], evaluation_data['originality'], evaluation_data['feasibility'],
                evaluation_data['technicalComplexity'], evaluation_data['scalability'], evaluation_data['marketSize'],
                evaluation_data['businessModel'], evaluation_data['impact'], evaluation_data['executionPlan'],
                evaluation_data['riskMitigation']
            ])
            total_score = round(total_sum / 10)
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
            logger.info(f"Starting AI evaluation for {submission.name} ({submission.uid})")

            # Create prompt
            prompt = self._create_evaluation_prompt(submission)

            # Get AI response (if model is available)
            if not getattr(self, 'model', None):
                raise RuntimeError("AI model not initialized")
            response = self.model.generate_content(prompt)

            # Extract text from various possible response shapes
            text = getattr(response, "text", None)
            if not text:
                try:
                    candidates = getattr(response, "candidates", [])
                    if candidates:
                        parts = getattr(candidates[0].content, "parts", [])
                        if parts and hasattr(parts[0], "text"):
                            text = parts[0].text
                except Exception:
                    text = None
            if not text:
                raise ValueError("Empty response from AI")

            # Parse response
            evaluation_data = self._parse_ai_response(text)

            # Create response model
            evaluation_response = EvaluationResponse(**evaluation_data)

            logger.info(f"AI evaluation completed for {submission.name}: {evaluation_response.totalScore}/100")
            return evaluation_response

        except Exception as e:
            logger.error(f"AI evaluation failed for {submission.name}: {e}")
            # Fallback to a safe synthetic evaluation to avoid 500s
            idea_len = len(submission.idea or '')
            # Heuristic fallback across 10 criteria
            # Heuristic fallback on 100-scale
            base = max(20, min(85, idea_len // 20 + 20))
            jitter = lambda n: max(1, min(100, n + (idea_len % 13) - 6))
            problem_clarity = jitter(base)
            originality = jitter(base - 5)
            feasibility = jitter(base - 8)
            technical_complexity = jitter(base - 10)
            scalability = jitter(base - 7)
            market_size = jitter(base - 4)
            business_model = jitter(base - 6)
            impact = jitter(base - 2)
            execution_plan = jitter(base - 9)
            risk_mitigation = jitter(base - 8)
            total10 = sum([
                problem_clarity, originality, feasibility, technical_complexity, scalability,
                market_size, business_model, impact, execution_plan, risk_mitigation
            ])
            total = max(1, min(100, round(total10 / 10)))
            feedback_text = (
                "Temporary evaluation generated due to AI service issue. "
                "Add concrete problem definition, audience, differentiation, and an MVP rollout plan to raise feasibility and scalability."
            )
            return EvaluationResponse(
                problemClarity=problem_clarity,
                originality=originality,
                feasibility=feasibility,
                technicalComplexity=technical_complexity,
                scalability=scalability,
                marketSize=market_size,
                businessModel=business_model,
                impact=impact,
                executionPlan=execution_plan,
                riskMitigation=risk_mitigation,
                totalScore=total,
                feedback=feedback_text,
                evaluatedAt=datetime.now(timezone.utc).isoformat(),
            )

# Create singleton instance
ai_service = AIService()
