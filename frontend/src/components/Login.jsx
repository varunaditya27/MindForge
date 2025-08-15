import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Globe, AlertCircle } from 'lucide-react';
import { signInWithGoogle } from '../utils/auth';
import Logo from './LogoFooter';

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
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[#070504]">
      {/* Subtle pattern & atmospheric layers */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-15" />
  {/* Removed smoke overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,107,0,0.18),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,154,60,0.12),transparent_65%)]" />

      <div className="relative max-w-md w-full">
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <Logo size="large" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold heading-gradient mb-3 tracking-wide">
            MindForge
          </h1>
          <p className="text-muted text-sm max-w-sm mx-auto leading-relaxed">
            Where creativity is tempered into innovation.
          </p>
        </div>

        {/* Auth Card */}
        <div className="molten-card backdrop-blur-md rounded-2xl p-8 border border-[#3a2516] shadow-[0_0_28px_-6px_rgba(255,107,0,0.45)] relative overflow-hidden ring-1 ring-[#ff6b00]/10">
          <div className="absolute -top-40 -left-28 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(255,107,0,0.25),transparent_65%)] blur-2xl" />
          <div className="absolute -bottom-48 -right-28 w-[30rem] h-[30rem] bg-[radial-gradient(circle_at_center,rgba(255,154,60,0.18),transparent_65%)] blur-2xl" />
          <div className="relative">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl font-semibold text-white mb-2 tracking-wide">
                Welcome Back
              </h2>
              <p className="text-soft/70 text-sm">
                Sign in to ignite & refine your innovation
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2 animate-pulse">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="hammer-btn group w-full relative overflow-hidden bg-gradient-to-br from-[#ff6200] via-[#ff4d00] to-[#ffb347] hover:from-[#ff751a] hover:via-[#ff560a] hover:to-[#ffc27a] text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_18px_-2px_rgba(255,107,0,0.55)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1a0f0a] focus:ring-[#ff6b00]/50"
              aria-label="Sign in with Google"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-500 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_60%)]" />
              {isLoading ? (
                <div className="loading-dots">
                  <div></div><div></div><div></div><div></div>
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
                Your public profile shows only name & alloy score. Feedback & email remain private in this session.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Glance */}
        <div className="mt-10 text-center">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-[#1d120c]/70 border border-[#3a2516]">
              <div className="text-xs text-muted mb-1">AI Powered</div>
              <div className="text-[10px] uppercase tracking-wide text-faint/70">Gemini Alloy</div>
            </div>
            <div className="p-3 rounded-lg bg-[#1d120c]/70 border border-[#3a2516]">
              <div className="text-xs text-muted mb-1">Live</div>
              <div className="text-[10px] uppercase tracking-wide text-faint/70">Auto Rankings</div>
            </div>
            <div className="p-3 rounded-lg bg-[#1d120c]/70 border border-[#3a2516]">
              <div className="text-xs text-muted mb-1">Instant</div>
              <div className="text-[10px] uppercase tracking-wide text-faint/70">Feedback</div>
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
