import firebase_admin
from firebase_admin import credentials, db
import logging
from typing import Dict, Any, Optional
from ..core.config import settings

logger = logging.getLogger(__name__)

class FirebaseService:
    """Service for Firebase Realtime Database operations"""
    
    def __init__(self):
        self._firebase_available = False
        self._initialize_firebase()
    
    def _initialize_firebase(self) -> None:
        """Initialize Firebase Admin SDK"""
        try:
            if not firebase_admin._apps:
                # Try to use service account key file first (for local development)
                service_account_path = settings.FIREBASE_SERVICE_ACCOUNT_KEY
                try:
                    import os
                    if os.path.exists(service_account_path):
                        cred = credentials.Certificate(service_account_path)
                        firebase_admin.initialize_app(cred, {
                            'databaseURL': settings.FIREBASE_DATABASE_URL
                        })
                        logger.info("Firebase initialized with service account credentials")
                    else:
                        # For production deployment, use default credentials
                        firebase_admin.initialize_app({
                            'databaseURL': settings.FIREBASE_DATABASE_URL
                        })
                        logger.info("Firebase initialized with default credentials")
                except Exception as cred_error:
                    # Fallback: try default credentials
                    try:
                        firebase_admin.initialize_app({
                            'databaseURL': settings.FIREBASE_DATABASE_URL
                        })
                        logger.info("Firebase initialized with default credentials (fallback)")
                    except Exception as fallback_error:
                        logger.warning(f"Firebase credentials not available: {fallback_error}")
                        logger.warning("Running in development mode without Firebase")
                        self._firebase_available = False
                        return
            self._firebase_available = True
        except Exception as e:
            logger.error(f"Firebase initialization error: {e}")
            self._firebase_available = False
    
    def update_leaderboard(self, uid: str, user_data: Dict[str, Any]) -> bool:
        """
        Update user's leaderboard entry
        
        Args:
            uid: Firebase user ID
            user_data: Dictionary containing name, branch, and score
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not self._firebase_available:
            logger.warning("Firebase not available, skipping leaderboard update")
            return False
            
        try:
            ref = db.reference('leaderboard')
            ref.child(uid).set(user_data)
            logger.info(f"Leaderboard updated for user {uid}: {user_data.get('name')}")
            return True
        except Exception as e:
            logger.error(f"Failed to update leaderboard for user {uid}: {e}")
            return False
    
    def get_leaderboard(self) -> Optional[Dict[str, Any]]:
        """
        Get current leaderboard data
        
        Returns:
            dict: Leaderboard data or None if error
        """
        if not self._firebase_available:
            logger.warning("Firebase not available, returning empty leaderboard")
            return {}
            
        try:
            ref = db.reference('leaderboard')
            data = ref.get()
            logger.info("Leaderboard data fetched successfully")
            return data
        except Exception as e:
            logger.error(f"Failed to fetch leaderboard: {e}")
            return None
    
    def delete_user_entry(self, uid: str) -> bool:
        """
        Delete a user's leaderboard entry
        
        Args:
            uid: Firebase user ID
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not self._firebase_available:
            logger.warning("Firebase not available, skipping delete operation")
            return False
            
        try:
            ref = db.reference('leaderboard')
            ref.child(uid).delete()
            logger.info(f"Deleted leaderboard entry for user {uid}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete leaderboard entry for user {uid}: {e}")
            return False

# Create singleton instance
firebase_service = FirebaseService()
