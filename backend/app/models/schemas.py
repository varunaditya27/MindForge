from pydantic import BaseModel, Field
from typing import Optional

_FIREBASE_UID_DESC = "Firebase user ID"

class IdeaSubmission(BaseModel):
    """Model for idea submission request"""
    uid: str = Field(..., description=_FIREBASE_UID_DESC)
    name: str = Field(..., min_length=1, max_length=100, description="User's full name")
    branch: str = Field(..., min_length=1, max_length=200, description="Academic branch/department")
    rollNumber: str = Field(..., min_length=1, max_length=20, description="Student roll number")
    idea: str = Field(..., min_length=50, max_length=2000, description="Business idea description")

class EvaluationResponse(BaseModel):
    """Primary evaluation response (new 2025 criteria only).

    The model returns the five atomic dimensions. We compute totalScore server-side
    as a simple rounded average (0-100) for leaderboard use.
    """
    aiRelevance: int = Field(..., ge=0, le=100, description="Centrality & plausibility of AI usage")
    creativity: int = Field(..., ge=0, le=100, description="Originality / novelty")
    impact: int = Field(..., ge=0, le=100, description="Real-world benefit & timeliness")
    clarity: int = Field(..., ge=0, le=100, description="Pitch clarity (~50 words, structure)")
    funFactor: int = Field(..., ge=0, le=100, description="Delight / wow / memorability")
    totalScore: int = Field(..., ge=0, le=100, description="Aggregate (average of 5 dimensions, rounded)")
    feedback: str = Field(..., min_length=50, description="Strengths + improvements (concise)")
    evaluatedAt: Optional[str] = Field(None, description="ISO timestamp when evaluated")

class LeaderboardEntry(BaseModel):
    """Model for leaderboard entry"""
    uid: str = Field(..., description=_FIREBASE_UID_DESC)
    name: str = Field(..., description="User's full name")
    branch: str = Field(..., description="Academic branch/department")
    score: int = Field(..., ge=0, le=100, description="Total score (0-100)")

class APIResponse(BaseModel):
    """Generic API response model"""
    status: str = Field(..., description="Response status")
    message: str = Field(..., description="Response message")
    data: Optional[dict] = Field(None, description="Optional response data")

class HealthResponse(BaseModel):
    """Health check response model"""
    status: str = Field(..., description="Service health status")
    message: str = Field(..., description="Health check message")
    timestamp: str = Field(..., description="Response timestamp")


class UserProfile(BaseModel):
    """User profile stored in Firestore"""
    uid: str = Field(..., description=_FIREBASE_UID_DESC)
    name: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = Field(None, max_length=200)
    photoURL: Optional[str] = Field(None)
    branch: str = Field(..., min_length=1, max_length=200)
    rollNumber: str = Field(..., min_length=1, max_length=20)
    createdAt: Optional[str] = Field(None, description="ISO timestamp when created")
    updatedAt: Optional[str] = Field(None, description="ISO timestamp when updated")
    lastEvaluation: Optional[EvaluationResponse] = Field(None, description="Most recent AI evaluation")
    # Submission tracking (single round)
    hasSubmitted: Optional[bool] = Field(False, description="Has submitted their idea")
