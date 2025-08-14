// Use explicit env in production; default to local in dev
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const submitIdea = async (submissionData) => {
  try {
  const response = await fetch(`${API_BASE_URL}/ideas/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submissionData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    console.error('Error submitting idea:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

// Async (queued) submission
export const submitIdeaAsync = async (submissionData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ideas/submit_async`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json(); // { jobId, status }
    return { success: true, data, error: null };
  } catch (error) {
    console.error('Error enqueuing idea:', error);
    return { success: false, data: null, error: error.message };
  }
};

export const getIdeaJobStatus = async (jobId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ideas/status/${jobId}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json(); // { id, status, result? }
    return { success: true, data, error: null };
  } catch (error) {
    console.error('Error fetching job status:', error);
    return { success: false, data: null, error: error.message };
  }
};

export const getLeaderboard = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

// Single round only; no round API needed

export const upsertUserProfile = async (profile) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return { success: true, data, error: null };
  } catch (error) {
    console.error('Error upserting profile:', error);
    return { success: false, data: null, error: error.message };
  }
};

export const getUserProfileApi = async (uid) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/profile/${uid}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return { success: true, data, error: null };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return { success: false, data: null, error: error.message };
  }
};

export const pingBackend = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('Backend ping failed:', error);
    return false;
  }
};
