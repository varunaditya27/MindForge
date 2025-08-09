import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Trophy, Medal, Award, Users, Crown, TrendingUp } from 'lucide-react';
import { getLeaderboard } from '../utils/api';

const Leaderboard = ({ currentUser }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let timerId;

    const fetchData = async () => {
      const result = await getLeaderboard();
      if (result.success && Array.isArray(result.data)) {
        setLeaderboardData(result.data);
        setError(null);
      } else if (result.success && result.data && typeof result.data === 'object') {
        // In case backend returns an object map
        const arr = Object.entries(result.data).map(([uid, userData]) => ({ uid, ...userData }))
          .sort((a, b) => b.score - a.score);
        setLeaderboardData(arr);
        setError(null);
      } else {
        setError(result.error || 'Error loading leaderboard');
      }
      setIsLoading(false);
    };

    fetchData();
    timerId = setInterval(fetchData, 5000); // poll every 5s

    return () => clearInterval(timerId);
  }, []);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
    }
  };

  const getRankBg = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-yellow-400/20 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-500/20 to-gray-400/20 border-gray-500/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-500/20 border-amber-600/30';
      default:
        return 'bg-dark-800/50 border-navy-800';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 32) return 'text-green-400';
    if (score >= 24) return 'text-yellow-400';
    if (score >= 16) return 'text-orange-400';
    return 'text-red-400';
  };

  const currentUserRank = leaderboardData.findIndex(entry => entry.uid === currentUser?.uid) + 1;

  if (isLoading) {
    return (
      <section className="py-12 px-4 sm:px-6 lg:px-8" id="leaderboard">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-navy-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-navy-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Live Leaderboard
            </h2>
            <p className="text-gray-400">
              Loading rankings...
            </p>
          </div>
          <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-8 border border-navy-800 card-glow">
            <div className="animate-pulse space-y-4">
              {['s1','s2','s3','s4','s5'].map((k) => (
                <div key={k} className="h-16 bg-dark-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 px-4 sm:px-6 lg:px-8" id="leaderboard">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8" id="leaderboard">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-navy-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-navy-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2 heading-gradient">
            Live Leaderboard
          </h2>
          <p className="text-gray-400">
            See how you rank against other participants
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-navy-800 text-center card-glow">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Users className="w-5 h-5 text-navy-400" />
              <span className="text-2xl font-bold text-white">{leaderboardData.length}</span>
            </div>
            <p className="text-sm text-gray-400">Total Participants</p>
          </div>
          
          {currentUserRank > 0 && (
            <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-navy-800 text-center card-glow">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 text-navy-400" />
                <span className="text-2xl font-bold text-white">#{currentUserRank}</span>
              </div>
              <p className="text-sm text-gray-400">Your Rank</p>
            </div>
          )}

          {leaderboardData.length > 0 && (
            <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-navy-800 text-center card-glow">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                <span className="text-2xl font-bold text-white">{leaderboardData[0]?.score || 0}</span>
              </div>
              <p className="text-sm text-gray-400">Top Score</p>
            </div>
          )}
        </div>

        {/* Leaderboard */}
  <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl border border-navy-800 overflow-hidden card-glow">
          {leaderboardData.length === 0 ? (
            <div className="p-8 text-center">
              <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">
                No submissions yet
              </h3>
              <p className="text-gray-400">
                Be the first to submit your idea and claim the top spot!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-navy-800">
              {leaderboardData.map((entry, index) => {
                const rank = index + 1;
                const isCurrentUser = entry.uid === currentUser?.uid;
                
                return (
                  <div
                    key={entry.uid}
                    className={`p-6 transition-all duration-200 ${
                      isCurrentUser ? 'bg-navy-500/10 border-l-4 border-navy-500' : ''
                    } ${getRankBg(rank)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Rank */}
                        <div className="w-12 h-12 flex items-center justify-center">
                          {getRankIcon(rank)}
                        </div>
                        
                        {/* User Info */}
                        <div>
                          <h4 className={`font-semibold ${isCurrentUser ? 'text-navy-300' : 'text-white'}`}>
                            {entry.name}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs bg-navy-500/20 text-navy-400 px-2 py-1 rounded-full">
                                You
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-400">
                            {entry.branch}
                          </p>
                        </div>
                      </div>
                      
                      {/* Score */}
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(entry.score)}`}>
                          {entry.score}
                        </div>
                        <div className="text-xs text-gray-500">
                          / 40 points
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Update Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🔄 Leaderboard auto-refreshes every few seconds as new ideas are submitted
          </p>
        </div>
      </div>
    </section>
  );
};

export default Leaderboard;

Leaderboard.propTypes = {
  currentUser: PropTypes.shape({
    uid: PropTypes.string,
  }),
};
