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
    <nav className="sticky top-0 z-50 bg-dark-900/90 backdrop-blur-md border-b border-navy-800/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Logo size="medium" />
          </div>

          {/* Center Title */}
      <div className="flex-1 flex justify-center">
            <div className="text-center">
        <h1 className="text-xl sm:text-2xl font-bold heading-gradient">
                IdeaArena
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">
                AI-Powered Idea Evaluation
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
                    className="w-8 h-8 rounded-full border-2 border-navy-600"
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
                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-200 shadow-sm"
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
