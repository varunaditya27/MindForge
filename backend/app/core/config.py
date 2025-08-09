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
    
    # Firebase Settings (split credentials only)
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "")
    # Split credentials (Render-friendly)
    FIREBASE_TYPE: str = os.getenv("FIREBASE_TYPE", "service_account")
    FIREBASE_PRIVATE_KEY_ID: str = os.getenv("FIREBASE_PRIVATE_KEY_ID", "")
    FIREBASE_PRIVATE_KEY: str = os.getenv("FIREBASE_PRIVATE_KEY", "")
    FIREBASE_CLIENT_EMAIL: str = os.getenv("FIREBASE_CLIENT_EMAIL", "")
    FIREBASE_CLIENT_ID: str = os.getenv("FIREBASE_CLIENT_ID", "")
    FIREBASE_AUTH_URI: str = os.getenv("FIREBASE_AUTH_URI", "https://accounts.google.com/o/oauth2/auth")
    FIREBASE_TOKEN_URI: str = os.getenv("FIREBASE_TOKEN_URI", "https://oauth2.googleapis.com/token")
    FIREBASE_AUTH_PROVIDER_X509_CERT_URL: str = os.getenv(
        "FIREBASE_AUTH_PROVIDER_X509_CERT_URL", "https://www.googleapis.com/oauth2/v1/certs"
    )
    FIREBASE_CLIENT_X509_CERT_URL: str = os.getenv("FIREBASE_CLIENT_X509_CERT_URL", "")
    FIREBASE_UNIVERSE_DOMAIN: str = os.getenv("FIREBASE_UNIVERSE_DOMAIN", "googleapis.com")
    
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
