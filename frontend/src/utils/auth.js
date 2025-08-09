import { auth, googleProvider } from '../firebase_config';
import { signInWithPopup, signOut } from 'firebase/auth';

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return {
      success: true,
      user: result.user,
      error: null
    };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    return {
      success: false,
      user: null,
      error: error.message
    };
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};
