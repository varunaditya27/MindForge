from fastapi import APIRouter
from datetime import datetime, timezone
from ..models.schemas import HealthResponse, APIResponse
from ..core.config import settings

router = APIRouter(prefix="", tags=["health"])

@router.get("/", response_model=APIResponse)
async def root():
    """Root endpoint - API status"""
    return APIResponse(
        status="success",
        message="IdeaArena API is running",
        data={"version": "1.0.0", "service": "IdeaArena API"}
    )

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        message="API is running successfully",
        timestamp=datetime.now(timezone.utc).isoformat()
    )

@router.get("/config/round", response_model=APIResponse)
async def current_round():
    """Expose current round number for clients"""
    return APIResponse(status="success", message="OK", data={"currentRound": str(settings.CURRENT_ROUND)})
