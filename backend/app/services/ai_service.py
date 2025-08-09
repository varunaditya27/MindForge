import google.generativeai as genai
import json
import logging
from typing import Dict, Any, Optional
from ..core.config import settings
from ..models.schemas import IdeaSubmission, EvaluationResponse

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
        
        Args:
            submission: The idea submission data
            
        Returns:
            str: Formatted prompt for AI evaluation
        """
        return f"""
        Evaluate the following business idea submitted by a college student for a coding event.
        
        Student: {submission.name}
        Branch: {submission.branch}
        Roll Number: {submission.rollNumber}
        
        Business Idea:
        {submission.idea}
        
        Please evaluate this idea on the following criteria (each out of 10 points):
        1. Feasibility - How realistic and achievable is this idea with current technology and resources?
        2. Originality - How unique and innovative is this concept? Does it offer something new?
        3. Scalability - Can this idea grow and expand to serve more users or markets?
        4. Impact - What positive change or value will this idea create for society or its target audience?
        
        Provide detailed feedback that is constructive, encouraging, and educational. Focus on both strengths and areas for improvement.
        The feedback should be 2-3 paragraphs long and help the student understand how to improve their idea.
        
        Respond in the following JSON format:
        {{
            "feasibility": <score 1-10>,
            "originality": <score 1-10>,
            "scalability": <score 1-10>,
            "impact": <score 1-10>,
            "totalScore": <sum of all scores>,
            "feedback": "<detailed constructive feedback in 2-3 paragraphs>"
        }}
        """
    
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
            required_fields = ['feasibility', 'originality', 'scalability', 'impact', 'feedback']
            for field in required_fields:
                if field not in evaluation_data:
                    raise ValueError(f"Missing required field: {field}")
            
            # Validate score ranges
            for score_field in ['feasibility', 'originality', 'scalability', 'impact']:
                score_raw = evaluation_data[score_field]
                try:
                    score = int(score_raw)
                except Exception:
                    raise ValueError(f"Invalid score for {score_field}: {score_raw}")
                # Clamp to valid bounds
                score = max(1, min(10, score))
                evaluation_data[score_field] = score
            
            # Calculate and validate total score
            total_score = (
                evaluation_data['feasibility'] + 
                evaluation_data['originality'] + 
                evaluation_data['scalability'] + 
                evaluation_data['impact']
            )
            evaluation_data['totalScore'] = total_score
            
            # Validate feedback
            if not isinstance(evaluation_data['feedback'], str) or len(evaluation_data['feedback']) < 50:
                raise ValueError("Feedback must be a string with at least 50 characters")
            
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

            logger.info(f"AI evaluation completed for {submission.name}: {evaluation_response.totalScore}/40")
            return evaluation_response

        except Exception as e:
            logger.error(f"AI evaluation failed for {submission.name}: {e}")
            # Fallback to a safe synthetic evaluation to avoid 500s
            idea_len = len(submission.idea or '')
            feasibility = max(1, min(10, idea_len // 120 + 3))
            originality = 6
            scalability = max(1, min(10, idea_len // 140 + 3))
            impact = 6
            total = feasibility + originality + scalability + impact
            feedback_text = (
                "Temporary evaluation generated due to AI service issue. "
                "Add concrete problem definition, audience, differentiation, and an MVP rollout plan to raise feasibility and scalability."
            )
            return EvaluationResponse(
                feasibility=feasibility,
                originality=originality,
                scalability=scalability,
                impact=impact,
                totalScore=total,
                feedback=feedback_text,
            )

# Create singleton instance
ai_service = AIService()
