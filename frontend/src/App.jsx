import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase_config';
import { getUserProfile, saveUserProfile, getFeedback, getScores, clearUserData, migrateLegacyKeys } from './utils/storage';
import { getUserProfileApi, upsertUserProfile } from './utils/api';

// Components
import Login from './components/Login';
import UserProfileSetup from './components/UserProfileSetup';
import Navbar from './components/Navbar';
import EventInfo from './components/EventInfo';
import IdeaSubmissionForm from './components/IdeaSubmissionForm';
import FeedbackCard from './components/FeedbackCard';
import Leaderboard from './components/Leaderboard';
import LogoFooter from './components/LogoFooter';
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
  migrateLegacyKeys(userKey);
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
                  aiRelevance: ev.aiRelevance,
                  creativity: ev.creativity,
                  impact: ev.impact,
                  clarity: ev.clarity,
                  funFactor: ev.funFactor,
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
      aiRelevance: submissionResult.aiRelevance,
      creativity: submissionResult.creativity,
      impact: submissionResult.impact,
      clarity: submissionResult.clarity,
      funFactor: submissionResult.funFactor,
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
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0b0604]">
        {/* Ember gradient washes */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_30%_40%,rgba(255,107,0,0.18),transparent_60%),radial-gradient(circle_at_70%_65%,rgba(255,159,64,0.14),transparent_65%)]" />
        {/* Subtle forge striations */}
        <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay bg-[repeating-linear-gradient(115deg,rgba(255,132,40,0.08)_0px,rgba(255,132,40,0.08)_2px,transparent_2px,transparent_8px)]" />
        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_55%,#090604_80%)]" />
        <div className="relative text-center px-6">
          <div className="mb-8 flex justify-center">
            <LogoFooter size="large" />
          </div>
          <div className="loading-dots mb-6 mx-auto" aria-label="Loading" role="status">
            <div />
            <div />
            <div />
            <div />
          </div>
          <p className="font-display tracking-wide text-sm uppercase bg-clip-text text-transparent bg-gradient-to-r from-[#ff6b00] via-[#ff9540] to-[#ff6b00] drop-shadow-[0_0_6px_rgba(255,107,0,0.35)]">
            Forging Evaluation...
          </p>
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
    <div className="relative min-h-screen bg-gradient-to-br from-black via-[#0c0705] to-[#120b07] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-10"></div>
      <div className="pointer-events-none absolute inset-0 bg-radial"></div>
      <div className="relative">
        <Navbar user={user} onSignOut={handleSignOut} />

        <main id="main" role="main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
  <footer className="relative mt-20 overflow-hidden" role="contentinfo">
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_top,rgba(15,10,7,0.95),rgba(15,10,7,0.85),transparent)]" />
          <div className="absolute inset-0 opacity-30 mix-blend-plus-lighter bg-[radial-gradient(circle_at_20%_40%,rgba(255,107,0,0.25),transparent_60%),radial-gradient(circle_at_80%_70%,rgba(255,154,60,0.18),transparent_65%)]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="flex flex-col items-center">
              <div className="flex justify-center mb-6">
                <LogoFooter size="small" opacity="muted" />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] tracking-wide uppercase text-[#a87454] mb-4">
                <span className="px-3 py-1 rounded-full bg-[#1d120c]/70 border border-[#3a2516]">Forged at RVCE</span>
                <span className="px-3 py-1 rounded-full bg-[#1d120c]/70 border border-[#3a2516]">AI Tempered</span>
                <span className="px-3 py-1 rounded-full bg-[#1d120c]/70 border border-[#3a2516]">Realtime Rankings</span>
              </div>
              <p className="text-[#e6cbb9]/50 text-[11px] tracking-wide uppercase">
                © 2025 MindForge • RVCE Coding Club • Alloys of Innovation
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
