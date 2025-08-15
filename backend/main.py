from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager
from app.core.config import settings
from app.routers import health_router, ideas_router, leaderboard_router, users_router
from app.services.evaluation_queue import evaluation_queue

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"Starting {settings.API_TITLE} v{settings.API_VERSION}")
    logger.info(f"Debug mode: {settings.DEBUG}")
    logger.info(f"CORS origins: {settings.CORS_ORIGINS}")
    # Start background evaluation queue worker (lazy; safe if called even if unused)
    evaluation_queue.start()
    yield
    # Shutdown
    # Gracefully stop queue worker
    try:
        await evaluation_queue.stop()
    except Exception:
        pass
    logger.info("Shutting down MindForge API")

# Initialize FastAPI app with lifespan to avoid deprecated on_event
app = FastAPI(
    title=settings.API_TITLE,
    description=settings.API_DESCRIPTION,
    version=settings.API_VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# Configure CORS
cors_kwargs = {
    "allow_origins": settings.CORS_ORIGINS,
    "allow_credentials": True,
    "allow_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["*"],
}
if settings.CORS_ALLOW_ORIGIN_REGEX:
    cors_kwargs["allow_origin_regex"] = settings.CORS_ALLOW_ORIGIN_REGEX

app.add_middleware(CORSMiddleware, **cors_kwargs)

# Include routers
app.include_router(health_router)
app.include_router(ideas_router)
app.include_router(leaderboard_router)
app.include_router(users_router)

# (Startup/Shutdown handled by lifespan above)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
