// Local storage keys
const KEYS = {
  FEEDBACK: 'ideaArenaFeedback',
  SCORES: 'ideaArenaScores',
  USER_PROFILE: 'ideaArenaUserProfile',
  SUBMISSION_TIME: 'ideaArenaSubmissionTime'
};

export const saveFeedback = (feedback) => {
  try {
    localStorage.setItem(KEYS.FEEDBACK, JSON.stringify(feedback));
    localStorage.setItem(KEYS.SUBMISSION_TIME, new Date().toISOString());
    return true;
  } catch (error) {
    console.error('Error saving feedback to localStorage:', error);
    return false;
  }
};

export const getFeedback = () => {
  try {
    const feedback = localStorage.getItem(KEYS.FEEDBACK);
    return feedback ? JSON.parse(feedback) : null;
  } catch (error) {
    console.error('Error getting feedback from localStorage:', error);
    return null;
  }
};

export const saveScores = (scores) => {
  try {
    localStorage.setItem(KEYS.SCORES, JSON.stringify(scores));
    return true;
  } catch (error) {
    console.error('Error saving scores to localStorage:', error);
    return false;
  }
};

export const getScores = () => {
  try {
    const scores = localStorage.getItem(KEYS.SCORES);
    return scores ? JSON.parse(scores) : null;
  } catch (error) {
    console.error('Error getting scores from localStorage:', error);
    return null;
  }
};

export const saveUserProfile = (profile) => {
  try {
    localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
    return true;
  } catch (error) {
    console.error('Error saving user profile to localStorage:', error);
    return false;
  }
};

export const getUserProfile = () => {
  try {
    const profile = localStorage.getItem(KEYS.USER_PROFILE);
    return profile ? JSON.parse(profile) : null;
  } catch (error) {
    console.error('Error getting user profile from localStorage:', error);
    return null;
  }
};

export const clearAllData = () => {
  try {
    Object.values(KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
};

export const getSubmissionTime = () => {
  try {
    return localStorage.getItem(KEYS.SUBMISSION_TIME);
  } catch (error) {
    console.error('Error getting submission time from localStorage:', error);
    return null;
  }
};
