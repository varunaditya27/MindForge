import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase_config';
import { getUserProfile, saveUserProfile, getFeedback, getScores, clearUserData } from './utils/storage';
import { getUserProfileApi, upsertUserProfile } from './utils/api';

// Components
import Login from './components/Login';
import UserProfileSetup from './components/UserProfileSetup';
import Navbar from './components/Navbar';
import EventInfo from './components/EventInfo';
import IdeaSubmissionForm from './components/IdeaSubmissionForm';
import FeedbackCard from './components/FeedbackCard';
import Leaderboard from './components/Leaderboard';
import Logo from './components/Logo';
import AIFunFactBar from './components/AIFunFactBar';

function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [scores, setScores] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasSubmittedThisRound, setHasSubmittedThisRound] = useState(false);
  // Single round submission

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        // Namespace storage per user (prefer email, else uid)
        const userKey = user.email || user.uid;
        // Load saved profile and feedback for this user
  const savedProfile = getUserProfile(userKey);
  const savedFeedback = getFeedback(userKey);
  const savedScores = getScores(userKey);
        
        setUserProfile(savedProfile);
        setFeedback(savedFeedback);
        setScores(savedScores);
        // Sync profile with backend Firestore
        const syncProfile = async () => {
          try {
            const res = await getUserProfileApi(user.uid);
            if (res.success && res.data) {
              // Prefer server profile on login
              saveUserProfile(res.data, userKey);
              setUserProfile(res.data);
              // If server has lastEvaluation, hydrate local feedback/scores
              if (res.data.lastEvaluation) {
                const ev = res.data.lastEvaluation;
                setFeedback({ feedback: ev.feedback });
                setScores({
                  problemClarity: ev.problemClarity,
                  originality: ev.originality,
                  feasibility: ev.feasibility,
                  technicalComplexity: ev.technicalComplexity,
                  scalability: ev.scalability,
                  marketSize: ev.marketSize,
                  businessModel: ev.businessModel,
                  impact: ev.impact,
                  executionPlan: ev.executionPlan,
                  riskMitigation: ev.riskMitigation,
                  totalScore: ev.totalScore,
                });
              }
              // Derive submission status (single round)
              setHasSubmittedThisRound(Boolean(res.data.hasSubmitted));
            } else if (!savedProfile) {
              // Create minimal profile if not existing server-side
              const minimal = {
                uid: user.uid,
                name: user.displayName || 'Anonymous',
                email: user.email || '',
                photoURL: user.photoURL || '',
                branch: '',
                rollNumber: ''
              };
              const up = await upsertUserProfile(minimal);
              if (up.success) {
                saveUserProfile(up.data, userKey);
                setUserProfile(up.data);
              }
            }
          } catch {
            // ignore background sync errors
          }
        };
        syncProfile();
      } else {
        setUserProfile(null);
        setFeedback(null);
        setScores(null);
        setHasSubmittedThisRound(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleSignOut = () => {
    const userKey = user?.email || user?.uid;
    if (userKey) {
      clearUserData(userKey);
    }
    setUser(null);
    setUserProfile(null);
    setFeedback(null);
    setScores(null);
  };

  const handleProfileComplete = (profile) => {
    const userKey = profile.email || profile.uid;
    setUserProfile(profile);
    saveUserProfile(profile, userKey);
    // persist to backend
    upsertUserProfile(profile);
  };

  const handleSubmissionSuccess = (submissionResult) => {
    setFeedback(submissionResult);
    setScores({
  problemClarity: submissionResult.problemClarity,
  originality: submissionResult.originality,
  feasibility: submissionResult.feasibility,
  technicalComplexity: submissionResult.technicalComplexity,
  scalability: submissionResult.scalability,
  marketSize: submissionResult.marketSize,
  businessModel: submissionResult.businessModel,
  impact: submissionResult.impact,
  executionPlan: submissionResult.executionPlan,
  riskMitigation: submissionResult.riskMitigation,
      totalScore: submissionResult.totalScore
    });
    setHasSubmittedThisRound(true);
  };

  const handleEnterTop3 = async () => {
    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    } catch {
      // ignore if confetti not available
    }
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

  // Show profile setup if user but profile is missing or incomplete
  if (!userProfile?.branch || !userProfile?.rollNumber) {
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

          <AIFunFactBar />

          <div className="grid grid-cols-1 gap-8">
            {!hasSubmittedThisRound ? (
              <IdeaSubmissionForm
                userProfile={userProfile}
                onSubmissionSuccess={handleSubmissionSuccess}
              />
            ) : (
              <section className="py-6">
                <div className="max-w-2xl mx-auto">
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <p className="text-amber-300 font-medium">
                        You’ve submitted — wait for Round 2.
                      </p>
                      {scores?.totalScore != null && (
                        <span className="text-amber-200 text-sm">Last score: {scores.totalScore}/100</span>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {feedback && scores && (
              <FeedbackCard feedback={feedback} scores={scores} />
            )}

            <Leaderboard currentUser={user} onEnterTop3={handleEnterTop3} />
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
