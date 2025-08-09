# Routers package
from .health import router as health_router
from .ideas import router as ideas_router
from .leaderboard import router as leaderboard_router

__all__ = ["health_router", "ideas_router", "leaderboard_router"]
