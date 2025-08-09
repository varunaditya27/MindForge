from fastapi import APIRouter, HTTPException
import logging
from ..models.schemas import IdeaSubmission, EvaluationResponse
from ..services import ai_service, firebase_service

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
        
        # Evaluate idea with AI
        evaluation = ai_service.evaluate_idea(submission)
        if not evaluation:
            raise HTTPException(
                status_code=500, 
                detail="Failed to evaluate idea with AI. Please try again."
            )
        
        # Prepare leaderboard data
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
        
        # Also upsert user profile so branch and rollNumber persist server-side
        try:
            firebase_service.upsert_user_profile(submission.uid, {
                'uid': submission.uid,
                'name': submission.name,
                'branch': submission.branch,
                'rollNumber': submission.rollNumber,
            })
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
