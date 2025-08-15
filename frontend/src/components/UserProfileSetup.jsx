import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { User, GraduationCap, Hash, ArrowRight } from 'lucide-react';
import { saveUserProfile } from '../utils/storage';

const UserProfileSetup = ({ user, onProfileComplete }) => {
  const [formData, setFormData] = useState({
    branch: '',
    rollNumber: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const branches = [
    'Computer Science and Engineering (CS)',
    'Computer Science and Engineering - Data Science (CD)',
    'Computer Science and Engineering - Cyber Security (CY)',
    'Computer Science and Engineering - Artificial Intelligence and Machine Learning (CI)',
    'Electronics and Communication Engineering (EC)',
    'Electrical and Electronics Engineering (EE)',
    'Electronics and Telecommunication Engineering (ET)',
    'Mechanical Engineering (ME)',
    'Civil Engineering (CV)',
    'Chemical Engineering (CH)',
    'Biotechnology (BT)',
    'Industrial Engineering and Management (IM)',
    'Aerospace Engineering (AS)',
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate form
    if (!formData.branch || !formData.rollNumber.trim()) {
      alert('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    // Save profile
    const profile = {
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      branch: formData.branch,
      rollNumber: formData.rollNumber.trim().toUpperCase(),
      createdAt: new Date().toISOString()
    };

  const saved = saveUserProfile(profile, profile.email || profile.uid);
    if (saved) {
      onProfileComplete(profile);
    } else {
      alert('Error saving profile. Please try again.');
    }

    setIsLoading(false);
  };

  const isFormValid = formData.branch && formData.rollNumber.trim();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#070504]">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-10" />
      <div className="pointer-events-none absolute inset-0 smoke-overlay" />
      <div className="max-w-md w-full relative">
        {/* Header */}
        <div className="text-center mb-10 relative">
          <div className="w-24 h-24 bg-gradient-to-br from-[#1e120b] to-[#2a160e] border border-[#3a2516] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_16px_-4px_rgba(255,107,0,0.4)]">
            <User className="w-12 h-12 text-[#ff9a3c] drop-shadow-[0_0_6px_rgba(255,154,60,0.6)]" />
          </div>
          <h1 className="font-display text-3xl font-semibold mb-3 heading-gradient tracking-wide">
            Complete Your Forge Pass
          </h1>
          <p className="text-muted text-sm max-w-sm mx-auto">
            Set your identity before striking the first hammer blow.
          </p>
        </div>

        {/* Profile Card */}
        <div className="molten-card backdrop-blur-md rounded-2xl p-8 border border-[#3a2516] shadow-[0_0_26px_-6px_rgba(255,107,0,0.45)] relative overflow-hidden">
          <div className="absolute -top-36 -left-28 w-80 h-80 bg-[radial-gradient(circle_at_center,rgba(255,107,0,0.25),transparent_65%)] blur-2xl" />
          <div className="absolute -bottom-40 -right-24 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(255,154,60,0.18),transparent_65%)] blur-2xl" />
          <div className="relative">
          {/* Current User Info */}
          <div className="flex items-center space-x-4 mb-8 p-4 bg-[#1d120c]/70 border border-[#3a2516] rounded-xl">
            <img 
              src={user.photoURL} 
              alt={user.displayName}
              className="w-12 h-12 rounded-full border-2 border-[#ff6b00]/60 shadow-[0_0_8px_rgba(255,107,0,0.4)]"
            />
            <div>
              <h3 className="font-semibold text-white">{user.displayName}</h3>
              <p className="text-sm text-faint">{user.email}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Branch Selection */}
            <div>
              <label className="flex items-center space-x-2 text-xs font-semibold tracking-wide text-muted mb-2">
                <GraduationCap className="w-4 h-4" />
                <span>Branch / Department</span>
              </label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleInputChange}
                className="w-full bg-[#120b07] border border-[#2c1b11] focus:border-[#ff6b00]/40 focus:ring-2 focus:ring-[#ff6b00]/30 rounded-lg px-4 py-3 text-white placeholder-[#845640] transition-all duration-300"
                required
              >
                <option value="">Select your branch</option>
                {branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>

            {/* Roll Number */}
            <div>
              <label className="flex items-center space-x-2 text-xs font-semibold tracking-wide text-muted mb-2">
                <Hash className="w-4 h-4" />
                <span>Roll Number</span>
              </label>
              <input
                type="text"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleInputChange}
                placeholder="e.g., RVCE25BCS001"
                className="w-full bg-[#120b07] border border-[#2c1b11] focus:border-[#ff6b00]/40 focus:ring-2 focus:ring-[#ff6b00]/30 rounded-lg px-4 py-3 text-white placeholder-[#845640] focus:placeholder-[#ff9a3c] transition-all duration-300"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="hammer-btn w-full bg-gradient-to-br from-[#ff6200] via-[#ff4d00] to-[#ffb347] hover:from-[#ff751a] hover:via-[#ff560a] hover:to-[#ffc27a] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_16px_-2px_rgba(255,107,0,0.55)]"
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
                  <span className="tracking-wide">Enter MindForge</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Privacy Note */}
        <div className="mt-6 text-center relative z-10">
          <p className="text-xs text-faint max-w-sm mx-auto leading-relaxed">
            Only your name & alloy score appear on the public rankings. Your roll number & email stay within the forge.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
};

UserProfileSetup.propTypes = {
  user: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    displayName: PropTypes.string,
    email: PropTypes.string,
    photoURL: PropTypes.string,
  }).isRequired,
  onProfileComplete: PropTypes.func.isRequired,
};

export default UserProfileSetup;
