// Base keys; we namespace them per user using `${base}:${userKey}`
const BASE_KEYS = {
  FEEDBACK: 'mindForgeFeedback',
  SCORES: 'mindForgeScores',
  USER_PROFILE: 'mindForgeUserProfile',
  SUBMISSION_TIME: 'mindForgeSubmissionTime'
};

// One-time migration from old IdeaArena keys -> MindForge keys
export const migrateLegacyKeys = (userKey) => {
  try {
    const legacy = {
      feedback: localStorage.getItem(`ideaArenaFeedback:${normalizeKey(userKey)}`),
      scores: localStorage.getItem(`ideaArenaScores:${normalizeKey(userKey)}`),
      profile: localStorage.getItem(`ideaArenaUserProfile:${normalizeKey(userKey)}`),
      submittedAt: localStorage.getItem(`ideaArenaSubmissionTime:${normalizeKey(userKey)}`)
    };
    if (legacy.feedback) localStorage.setItem(k(BASE_KEYS.FEEDBACK, userKey), legacy.feedback);
    if (legacy.scores) localStorage.setItem(k(BASE_KEYS.SCORES, userKey), legacy.scores);
    if (legacy.profile) localStorage.setItem(k(BASE_KEYS.USER_PROFILE, userKey), legacy.profile);
    if (legacy.submittedAt) localStorage.setItem(k(BASE_KEYS.SUBMISSION_TIME, userKey), legacy.submittedAt);
  } catch (e) {
    console.warn('Legacy key migration failed', e);
  }
};

const normalizeKey = (userKey) => {
  if (!userKey) return 'anonymous';
  // Use email as requested; fall back to uid or raw string
  return String(userKey).trim().toLowerCase();
};

const k = (base, userKey) => `${base}:${normalizeKey(userKey)}`;

export const saveFeedback = (feedback, userKey) => {
  try {
  localStorage.setItem(k(BASE_KEYS.FEEDBACK, userKey), JSON.stringify(feedback));
  localStorage.setItem(k(BASE_KEYS.SUBMISSION_TIME, userKey), new Date().toISOString());
    return true;
  } catch (error) {
    console.error('Error saving feedback to localStorage:', error);
    return false;
  }
};

export const getFeedback = (userKey) => {
  try {
  const feedback = localStorage.getItem(k(BASE_KEYS.FEEDBACK, userKey));
    return feedback ? JSON.parse(feedback) : null;
  } catch (error) {
    console.error('Error getting feedback from localStorage:', error);
    return null;
  }
};

export const saveScores = (scores, userKey) => {
  try {
  localStorage.setItem(k(BASE_KEYS.SCORES, userKey), JSON.stringify(scores));
    return true;
  } catch (error) {
    console.error('Error saving scores to localStorage:', error);
    return false;
  }
};

export const getScores = (userKey) => {
  try {
  const scores = localStorage.getItem(k(BASE_KEYS.SCORES, userKey));
    return scores ? JSON.parse(scores) : null;
  } catch (error) {
    console.error('Error getting scores from localStorage:', error);
    return null;
  }
};

export const saveUserProfile = (profile, userKey) => {
  try {
  const key = userKey || profile?.email || profile?.uid;
  localStorage.setItem(k(BASE_KEYS.USER_PROFILE, key), JSON.stringify(profile));
    return true;
  } catch (error) {
    console.error('Error saving user profile to localStorage:', error);
    return false;
  }
};

export const getUserProfile = (userKey) => {
  try {
  const profile = localStorage.getItem(k(BASE_KEYS.USER_PROFILE, userKey));
    return profile ? JSON.parse(profile) : null;
  } catch (error) {
    console.error('Error getting user profile from localStorage:', error);
    return null;
  }
};

export const clearAllData = () => {
  // Dangerous global clear across users is avoided intentionally. Use clearUserData.
  return true;
};

export const clearUserData = (userKey) => {
  localStorage.removeItem(k(BASE_KEYS.FEEDBACK, userKey));
  localStorage.removeItem(k(BASE_KEYS.SCORES, userKey));
  localStorage.removeItem(k(BASE_KEYS.USER_PROFILE, userKey));
  localStorage.removeItem(k(BASE_KEYS.SUBMISSION_TIME, userKey));
  return true;
};

export const getSubmissionTime = (userKey) => {
  return localStorage.getItem(k(BASE_KEYS.SUBMISSION_TIME, userKey));
};
