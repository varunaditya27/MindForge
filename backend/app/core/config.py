import os
from dotenv import load_dotenv
from typing import List, Optional

# Load environment variables
load_dotenv()

class Settings:
    """Application settings and configuration"""
    
    # API Settings
    API_TITLE: str = "IdeaArena API"
    API_DESCRIPTION: str = "AI-powered idea evaluation platform for RVCE coding events"
    API_VERSION: str = "1.0.0"
    
    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # CORS Settings
    CORS_ORIGINS: List[str] = [
        o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()
    ]
    # Optional: allow regex for preview domains (e.g., Vercel)
    CORS_ALLOW_ORIGIN_REGEX: Optional[str] = os.getenv("CORS_ALLOW_ORIGIN_REGEX")
    
    # External API Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Firebase Settings
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "")
    FIREBASE_SERVICE_ACCOUNT_KEY: str = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY", "firebase_admin_sdk.json")
    # Optional: provide the full Service Account JSON via env instead of a file
    FIREBASE_SERVICE_ACCOUNT_JSON: str = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "")
    
    # Validation
    def validate_settings(self) -> None:
        """Validate that all required settings are present"""
        # Keep non-fatal to allow running without Gemini in dev or fallback mode
        if not self.GEMINI_API_KEY:
            import logging
            logging.getLogger(__name__).warning(
                "GEMINI_API_KEY not set; AI evaluation will use a safe fallback."
            )
    # Firestore does not require a database URL

# Create settings instance
settings = Settings()

# Validate settings on import
settings.validate_settings()
