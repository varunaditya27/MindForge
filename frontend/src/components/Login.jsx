import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Globe, AlertCircle } from 'lucide-react';
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
          <h1 className="font-display text-3xl sm:text-4xl font-semibold heading-gradient mb-2">
            MindForge
          </h1>
          <p className="text-muted">
            Where creativity is tempered into innovation
          </p>
        </div>

        {/* Login Card */}
  <div className="molten-card backdrop-blur-md rounded-2xl p-8 border border-[#3a2516] shadow-[0_0_25px_-4px_rgba(255,107,0,0.4)] ring-1 ring-[#ff6b00]/10 relative overflow-hidden">
          <div className="text-center mb-6">
            <h2 className="font-display text-2xl font-semibold text-white mb-2">
              Welcome Back
            </h2>
              <p className="text-soft/70 text-sm">
                Sign in to ignite and refine your innovation
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
                <Globe className="w-5 h-5" />
                <span>Enter the Forge</span>
              </>
            )}
          </button>
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="hammer-btn w-full relative overflow-hidden bg-gradient-to-br from-[#ff6200] via-[#ff4d00] to-[#ffb347] hover:from-[#ff751a] hover:via-[#ff560a] hover:to-[#ffc27a] text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_16px_-2px_rgba(255,107,0,0.55)]"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-500 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_60%)]" />
            {isLoading ? (
              <div className="loading-dots">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
            ) : (
              <>
                <Globe className="w-5 h-5 drop-shadow" />
                <span className="tracking-wide">Enter the Forge</span>
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-xs text-faint leading-relaxed">
              By signing in you agree your name & alloy score appear on the public forge rankings. Detailed feedback stays private to your session.
            </p>
          </div>
        </div>

        {/* Event Info */}
        <div className="mt-10 text-center">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-[#1d120c]/70 border border-[#3a2516]">
              <div className="text-xs text-muted mb-1">AI Powered</div>
              <div className="text-[10px] uppercase tracking-wide text-faint/60">Gemini Alloy</div>
            </div>
            <div className="p-3 rounded-lg bg-[#1d120c]/70 border border-[#3a2516]">
              <div className="text-xs text-muted mb-1">Live</div>
              <div className="text-[10px] uppercase tracking-wide text-faint/60">Auto Rankings</div>
            </div>
            <div className="p-3 rounded-lg bg-[#1d120c]/70 border border-[#3a2516]">
              <div className="text-xs text-muted mb-1">Instant</div>
              <div className="text-[10px] uppercase tracking-wide text-faint/60">Feedback</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

Login.propTypes = {
  onLoginSuccess: PropTypes.func.isRequired,
};
