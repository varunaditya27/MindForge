from fastapi import APIRouter, HTTPException
from typing import List
import logging
from ..models.schemas import LeaderboardEntry
from ..services import firebase_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])

@router.get("", response_model=List[LeaderboardEntry])
async def get_leaderboard():
    """
    Get current leaderboard rankings
    
    Returns:
        List[LeaderboardEntry]: Sorted leaderboard data
        
    Raises:
        HTTPException: If leaderboard data cannot be retrieved
    """
    try:
        # Get leaderboard data from Firebase
        leaderboard_data = firebase_service.get_leaderboard()
        
        if not leaderboard_data:
            return []
        
        # Convert to list and sort by score
        leaderboard_list = []
        for uid, data in leaderboard_data.items():
            entry = LeaderboardEntry(
                uid=uid,
                name=data.get('name', 'Unknown'),
                branch=data.get('branch', 'Unknown'),
                score=data.get('score', 0)
            )
            leaderboard_list.append(entry)
        
        # Sort by score in descending order
        leaderboard_list.sort(key=lambda x: x.score, reverse=True)
        
        logger.info(f"Retrieved leaderboard with {len(leaderboard_list)} entries")
        return leaderboard_list
        
    except Exception as e:
        logger.error(f"Failed to retrieve leaderboard: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Failed to fetch leaderboard data"
        )
