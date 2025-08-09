from pydantic import BaseModel, Field
from typing import Optional

class IdeaSubmission(BaseModel):
    """Model for idea submission request"""
    uid: str = Field(..., description="Firebase user ID")
    name: str = Field(..., min_length=1, max_length=100, description="User's full name")
    branch: str = Field(..., min_length=1, max_length=200, description="Academic branch/department")
    rollNumber: str = Field(..., min_length=1, max_length=20, description="Student roll number")
    idea: str = Field(..., min_length=50, max_length=2000, description="Business idea description")

class EvaluationResponse(BaseModel):
    """Model for AI evaluation response"""
    feasibility: int = Field(..., ge=1, le=10, description="Feasibility score (1-10)")
    originality: int = Field(..., ge=1, le=10, description="Originality score (1-10)")
    scalability: int = Field(..., ge=1, le=10, description="Scalability score (1-10)")
    impact: int = Field(..., ge=1, le=10, description="Impact score (1-10)")
    totalScore: int = Field(..., ge=4, le=40, description="Total score (sum of all criteria)")
    feedback: str = Field(..., min_length=50, description="Detailed AI feedback")

class LeaderboardEntry(BaseModel):
    """Model for leaderboard entry"""
    uid: str = Field(..., description="Firebase user ID")
    name: str = Field(..., description="User's full name")
    branch: str = Field(..., description="Academic branch/department")
    score: int = Field(..., ge=0, le=40, description="Total score")

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
