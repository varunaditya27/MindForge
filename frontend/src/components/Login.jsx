import React, { useState } from 'react';
import { Chrome, AlertCircle } from 'lucide-react';
import { signInWithGoogle } from '../utils/auth';
import Logo from './Logo';

const Login = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    const result = await signInWithGoogle();
    
    if (result.success) {
      onLoginSuccess(result.user);
    } else {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-navy-950 flex items-center justify-center p-4 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30"></div>
      <div className="pointer-events-none absolute inset-0 bg-radial"></div>
      <div className="relative max-w-md w-full">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo size="large" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold heading-gradient mb-2">
            IdeaArena
          </h1>
          <p className="text-gray-400">
            AI-Powered Idea Evaluation Platform
          </p>
        </div>

        {/* Login Card */}
  <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-8 border border-navy-800 shadow-2xl card-glow">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-400">
              Sign in to submit your innovative ideas
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? (
              <div className="loading-dots">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
            ) : (
              <>
                <Chrome className="w-5 h-5" />
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By signing in, you agree to participate in the IdeaArena event and 
              allow your name and score to be displayed on the public leaderboard.
            </p>
          </div>
        </div>

        {/* Event Info */}
        <div className="mt-8 text-center">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-navy-400 font-semibold">AI Powered</div>
              <div className="text-xs text-gray-500">Gemini Evaluation</div>
            </div>
            <div>
              <div className="text-navy-400 font-semibold">Real-time</div>
              <div className="text-xs text-gray-500">Live Leaderboard</div>
            </div>
            <div>
              <div className="text-navy-400 font-semibold">Instant</div>
              <div className="text-xs text-gray-500">Feedback</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
