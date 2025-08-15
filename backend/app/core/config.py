import os
from dotenv import load_dotenv
from typing import List, Optional

# Load environment variables
load_dotenv()

class Settings:
    """Application settings and configuration"""
    
    # API Settings
    API_TITLE: str = "MindForge API"
    API_DESCRIPTION: str = "MindForge – AI-tempered innovation evaluation platform for RVCE coding events"
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
    # Optional: multiple keys for bursty events (comma-separated)
    GEMINI_API_KEYS: List[str] = [
        k.strip() for k in os.getenv("GEMINI_API_KEYS", "").split(",") if k.strip()
    ]
    # Optional: Google Programmable Search Engine (CSE) for web search (free tier)
    GOOGLE_CSE_API_KEY: str = os.getenv("GOOGLE_CSE_API_KEY", "")
    GOOGLE_CSE_CX: str = os.getenv("GOOGLE_CSE_CX", "")
    
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
        if not (self.GEMINI_API_KEY or self.GEMINI_API_KEYS):
            import logging
            logging.getLogger(__name__).warning(
                "No Gemini API key configured; AI evaluation will use a safe fallback."
            )
    # Firestore does not require a database URL

# Create settings instance
settings = Settings()

# Validate settings on import
settings.validate_settings()
