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
    'Civil Engineering (CE)',
    'Chemical Engineering (CHE)',
    'Biotechnology (BT)',
    'Industrial Engineering and Management (IEM)',
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
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-navy-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-navy-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-navy-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-400">
            Tell us more about yourself to get started
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-8 border border-navy-800 shadow-2xl">
          {/* Current User Info */}
          <div className="flex items-center space-x-4 mb-8 p-4 bg-dark-700/50 rounded-xl">
            <img 
              src={user.photoURL} 
              alt={user.displayName}
              className="w-12 h-12 rounded-full border-2 border-navy-600"
            />
            <div>
              <h3 className="font-semibold text-white">{user.displayName}</h3>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Branch Selection */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
                <GraduationCap className="w-4 h-4" />
                <span>Branch/Department</span>
              </label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleInputChange}
                className="w-full bg-dark-700 border border-navy-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all duration-200"
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
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
                <Hash className="w-4 h-4" />
                <span>Roll Number</span>
              </label>
              <input
                type="text"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleInputChange}
                placeholder="e.g., RVCE25BCS001"
                className="w-full bg-dark-700 border border-navy-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="w-full bg-gradient-to-r from-navy-600 to-navy-500 hover:from-navy-500 hover:to-navy-400 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <span>Continue to IdeaArena</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Privacy Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Your name and score will be visible on the public leaderboard. 
            All other information remains private.
          </p>
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
