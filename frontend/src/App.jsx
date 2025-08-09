import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase_config';
import { getUserProfile, getFeedback, getScores } from './utils/storage';

// Components
import Login from './components/Login';
import UserProfileSetup from './components/UserProfileSetup';
import Navbar from './components/Navbar';
import EventInfo from './components/EventInfo';
import IdeaSubmissionForm from './components/IdeaSubmissionForm';
import FeedbackCard from './components/FeedbackCard';
import Leaderboard from './components/Leaderboard';
import Logo from './components/Logo';

function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [scores, setScores] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        // Load saved profile and feedback
        const savedProfile = getUserProfile();
        const savedFeedback = getFeedback();
        const savedScores = getScores();
        
        setUserProfile(savedProfile);
        setFeedback(savedFeedback);
        setScores(savedScores);
      } else {
        setUserProfile(null);
        setFeedback(null);
        setScores(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleSignOut = () => {
    setUser(null);
    setUserProfile(null);
    setFeedback(null);
    setScores(null);
  };

  const handleProfileComplete = (profile) => {
    setUserProfile(profile);
  };

  const handleSubmissionSuccess = (submissionResult) => {
    setFeedback(submissionResult);
    setScores({
      feasibility: submissionResult.feasibility,
      originality: submissionResult.originality,
      scalability: submissionResult.scalability,
      impact: submissionResult.impact,
      totalScore: submissionResult.totalScore
    });
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-navy-950 flex items-center justify-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-30"></div>
        <div className="pointer-events-none absolute inset-0 bg-radial"></div>
        <div className="relative text-center px-6">
          <div className="mb-6 flex justify-center">
            <Logo size="large" />
          </div>
          <div className="loading-dots mb-4">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          <p className="text-gray-400">Loading IdeaArena...</p>
        </div>
      </div>
    );
  }

  // Show login if no user
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Show profile setup if user but no profile
  if (!userProfile) {
    return (
      <UserProfileSetup 
        user={user} 
        onProfileComplete={handleProfileComplete} 
      />
    );
  }

  // Main application
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-navy-950 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30"></div>
      <div className="pointer-events-none absolute inset-0 bg-radial"></div>
      <div className="relative">
        <Navbar user={user} onSignOut={handleSignOut} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EventInfo />

          <div className="grid grid-cols-1 gap-8">
            <IdeaSubmissionForm
              userProfile={userProfile}
              onSubmissionSuccess={handleSubmissionSuccess}
            />

            {feedback && scores && (
              <FeedbackCard feedback={feedback} scores={scores} />
            )}

            <Leaderboard currentUser={user} />
          </div>
        </main>

        {/* Footer */}
        <footer className="relative bg-dark-900/80 backdrop-blur-sm border-t border-navy-800 py-8 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Logo size="small" opacity="muted" />
              </div>
              <p className="text-gray-500 text-sm">
                © 2025 IdeaArena - RVCE Coding Club. Powered by AI.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
