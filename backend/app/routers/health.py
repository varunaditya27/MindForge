from fastapi import APIRouter
from datetime import datetime
from ..models.schemas import HealthResponse, APIResponse

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
        timestamp=datetime.utcnow().isoformat()
    )
