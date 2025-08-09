import os
from dotenv import load_dotenv
from typing import List

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
    CORS_ORIGINS: List[str] = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    
    # External API Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Firebase Settings
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "")
    FIREBASE_SERVICE_ACCOUNT_KEY: str = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY", "firebase_admin_sdk.json")
    
    # Validation
    def validate_settings(self) -> None:
        """Validate that all required settings are present"""
        if not self.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY environment variable is required")
    # Firestore does not require a database URL

# Create settings instance
settings = Settings()

# Validate settings on import
settings.validate_settings()
