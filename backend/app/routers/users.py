from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
import logging
from ..models.schemas import UserProfile
from ..services import firebase_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["users"])


@router.post("/profile", response_model=UserProfile)
async def upsert_profile(profile: UserProfile):
    """Create or update a user's profile in Firestore"""
    try:
        now = datetime.now(timezone.utc).isoformat()
        payload = profile.model_dump()
        payload["updatedAt"] = now
        if not payload.get("createdAt"):
            payload["createdAt"] = now

        ok = firebase_service.upsert_user_profile(profile.uid, payload)
        if not ok:
            raise HTTPException(status_code=500, detail="Failed to save user profile")
        return UserProfile(**payload)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error upserting user profile: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/profile/{uid}", response_model=UserProfile | None)
async def get_profile(uid: str):
    """Get a user's profile from Firestore"""
    try:
        data = firebase_service.get_user_profile(uid)
        return UserProfile(**data) if data else None
    except Exception as e:
        logger.error(f"Error fetching user profile {uid}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
