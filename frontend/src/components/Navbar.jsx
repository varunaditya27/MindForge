import React from 'react';
import PropTypes from 'prop-types';
import { LogOut } from 'lucide-react';
import { logout } from '../utils/auth';
import Logo from './Logo';

const Navbar = ({ user, onSignOut }) => {
  const handleSignOut = async () => {
    const result = await logout();
    if (result.success) {
      onSignOut();
    }
  };

  return (
  <nav className="sticky top-0 z-50 backdrop-blur-md border-b border-[#3a2516]/70 bg-gradient-to-b from-[#120b07cc] to-[#0b0604cc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Logo size="medium" />
          </div>

          {/* Center Title */}
      <div className="flex-1 flex justify-center">
            <div className="text-center">
  <h1 className="font-display text-xl sm:text-2xl font-semibold heading-gradient tracking-wide drop-shadow-[0_0_4px_rgba(255,107,0,0.4)]">
                MindForge
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">
                Tempered AI Idea Scoring
              </p>
            </div>
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2">
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full border-2 border-[#ff6b00]/60 shadow-[0_0_6px_rgba(255,107,0,0.5)]"
                  />
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      {user.displayName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-lg bg-gradient-to-br from-[#3d0f0f] to-[#1a0707] hover:from-[#5e1212] hover:to-[#2a0a0a] text-red-300 hover:text-red-200 transition-all duration-300 shadow-[0_0_6px_rgba(255,60,60,0.3)]"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-navy-600 animate-pulse"></div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

Navbar.propTypes = {
  user: PropTypes.shape({
    displayName: PropTypes.string,
    email: PropTypes.string,
    photoURL: PropTypes.string,
  }),
  onSignOut: PropTypes.func.isRequired,
};
