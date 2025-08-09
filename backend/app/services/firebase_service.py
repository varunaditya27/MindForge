import firebase_admin
from firebase_admin import credentials, firestore
import logging
from typing import Dict, Any, Optional
from ..core.config import settings

logger = logging.getLogger(__name__)

class FirebaseService:
    """Service for Firebase Firestore operations"""
    
    def __init__(self):
        self._firebase_available = False
        self._initialize_firebase()
    
    def _initialize_firebase(self) -> None:
        """Initialize Firebase Admin SDK and Firestore client"""
        try:
            if not firebase_admin._apps:
                # Prefer explicit Service Account JSON from environment if provided (good for Render/CI)
                try:
                    if settings.FIREBASE_SERVICE_ACCOUNT_JSON:
                        import json
                        info = json.loads(settings.FIREBASE_SERVICE_ACCOUNT_JSON)
                        cred = credentials.Certificate(info)
                        firebase_admin.initialize_app(cred)
                        logger.info("Firebase initialized with JSON credentials from env")
                    else:
                        # Try to use service account key file first (for local development)
                        import os
                        service_account_path = settings.FIREBASE_SERVICE_ACCOUNT_KEY
                        if os.path.exists(service_account_path):
                            cred = credentials.Certificate(service_account_path)
                            firebase_admin.initialize_app(cred)
                            logger.info("Firebase initialized with service account file")
                        else:
                            # For production deployment, use default credentials (e.g., Google Cloud)
                            firebase_admin.initialize_app()
                            logger.info("Firebase initialized with default application credentials")
                except Exception:
                    # Fallback: try default credentials
                    try:
                        firebase_admin.initialize_app()
                        logger.info("Firebase initialized with default credentials (fallback)")
                    except Exception as fallback_error:
                        logger.warning(f"Firebase credentials not available: {fallback_error}")
                        logger.warning("Running in development mode without Firebase")
                        self._firebase_available = False
                        return
            # Initialize Firestore client
            self._db = firestore.client()
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
            # Firestore: collection 'leaderboard', document per uid
            doc_ref = self._db.collection('leaderboard').document(uid)
            doc_ref.set(user_data)
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
            # Fetch all leaderboard entries from Firestore
            docs = self._db.collection('leaderboard').stream()
            data: Dict[str, Any] = {}
            for doc in docs:
                data[doc.id] = doc.to_dict() or {}
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
            self._db.collection('leaderboard').document(uid).delete()
            logger.info(f"Deleted leaderboard entry for user {uid}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete leaderboard entry for user {uid}: {e}")
            return False

    # User profile operations
    def upsert_user_profile(self, uid: str, profile: Dict[str, Any]) -> bool:
        """
        Create or update a user's profile in Firestore
        Collection: users/{uid}
        """
        if not self._firebase_available:
            logger.warning("Firebase not available, skipping user profile upsert")
            return False
        try:
            doc_ref = self._db.collection('users').document(uid)
            doc_ref.set(profile, merge=True)
            logger.info(f"User profile upserted for {uid}")
            return True
        except Exception as e:
            logger.error(f"Failed to upsert user profile for {uid}: {e}")
            return False

    def get_user_profile(self, uid: str) -> Optional[Dict[str, Any]]:
        """Fetch a user's profile from Firestore"""
        if not self._firebase_available:
            logger.warning("Firebase not available, returning None for user profile")
            return None
        try:
            doc = self._db.collection('users').document(uid).get()
            if doc.exists:
                return doc.to_dict() or None
            return None
        except Exception as e:
            logger.error(f"Failed to fetch user profile for {uid}: {e}")
            return None

# Create singleton instance
firebase_service = FirebaseService()
