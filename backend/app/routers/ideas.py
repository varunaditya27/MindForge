from fastapi import APIRouter, HTTPException
import logging
from ..models.schemas import IdeaSubmission, EvaluationResponse
from ..services import ai_service, firebase_service
from ..services.agent_service import agent_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ideas", tags=["ideas"])

@router.post("/submit", response_model=EvaluationResponse)
async def submit_idea(submission: IdeaSubmission):
    """
    Submit a business idea for AI evaluation
    
    Args:
        submission: The idea submission data
        
    Returns:
        EvaluationResponse: AI evaluation results
        
    Raises:
        HTTPException: If evaluation or database update fails
    """
    try:
        logger.info(f"Received submission from {submission.name} ({submission.uid})")

        # Prevent duplicate submissions (single round only)
        try:
            existing_profile = firebase_service.get_user_profile(submission.uid) or {}
        except Exception:
            existing_profile = {}
        if existing_profile.get("hasSubmitted"):
            raise HTTPException(status_code=400, detail="Already submitted")
        
        # Try agentic evaluation first (web-augmented), then fallback to static
        evaluation = agent_service.evaluate(submission)
        logger.info(f"Agentic evaluation result: {evaluation}")
        if not evaluation:
            evaluation = ai_service.evaluate_idea(submission)
            print("Agentic evaluation failed, falling back to static evaluation.")
        if not evaluation:
            raise HTTPException(
                status_code=500, 
                detail="Failed to evaluate idea with AI. Please try again."
            )
        
    # Persist submitted idea (private, per-user)
        try:
            firebase_service.save_user_idea(submission.uid, {
        'round': '1',
                'idea': submission.idea,
            })
        except Exception:
            pass

        # Prepare leaderboard data (0-100)
        leaderboard_data = {
            'name': submission.name,
            'branch': submission.branch,
            'score': evaluation.totalScore
        }
        
        # Update Firebase leaderboard
        success = firebase_service.update_leaderboard(submission.uid, leaderboard_data)
        if not success:
            logger.warning(f"Failed to update leaderboard for {submission.name}")
            # Don't fail the request if leaderboard update fails
            # The user still gets their evaluation
        
        # Also upsert user profile so branch and rollNumber persist server-side,
        # and store lastEvaluation for cross-device/account switching
        try:
            prev_best = (existing_profile or {}).get('personalBestScore')
            personal_best = max(prev_best or 0, evaluation.totalScore)
            payload = {
                'uid': submission.uid,
                'name': submission.name,
                'branch': submission.branch,
                'rollNumber': submission.rollNumber,
                'lastEvaluation': evaluation.model_dump(),
                'hasSubmitted': True,
                'personalBestScore': personal_best,
            }
            firebase_service.upsert_user_profile(submission.uid, payload)
        except Exception:
            pass

        logger.info(f"Successfully processed submission for {submission.name}")
        return evaluation
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error processing submission: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Internal server error. Please try again."
        )
