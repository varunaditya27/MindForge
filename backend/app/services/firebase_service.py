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
    
    def _get_credentials(self):
        """Build firebase_admin credentials strictly from split env variables.
        Returns a tuple (cred_or_none, source_str).
        """
        if (
            settings.FIREBASE_PRIVATE_KEY
            and settings.FIREBASE_CLIENT_EMAIL
            and settings.FIREBASE_PRIVATE_KEY_ID
        ):
            try:
                info = {
                    "type": settings.FIREBASE_TYPE or "service_account",
                    "project_id": settings.FIREBASE_PROJECT_ID,
                    "private_key_id": settings.FIREBASE_PRIVATE_KEY_ID,
                    # Ensure newlines are real
                    "private_key": settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n"),
                    "client_email": settings.FIREBASE_CLIENT_EMAIL,
                    "client_id": settings.FIREBASE_CLIENT_ID,
                    "auth_uri": settings.FIREBASE_AUTH_URI,
                    "token_uri": settings.FIREBASE_TOKEN_URI,
                    "auth_provider_x509_cert_url": settings.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
                    "client_x509_cert_url": settings.FIREBASE_CLIENT_X509_CERT_URL,
                    "universe_domain": settings.FIREBASE_UNIVERSE_DOMAIN,
                }
                return credentials.Certificate(info), "env_split"
            except Exception as e:
                logger.warning(f"Invalid split FIREBASE_* env credentials: {e}")
        return None, "missing"

    def _initialize_firebase(self) -> None:
        """Initialize Firebase Admin SDK and Firestore client"""
        try:
            if not firebase_admin._apps:
                cred, source = self._get_credentials()
                if cred is not None:
                    firebase_admin.initialize_app(cred)
                    logger.info(f"Firebase initialized with credentials source: {source}")
                else:
                    logger.warning("Firebase split credentials missing; skipping initialization")
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
