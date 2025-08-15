import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Trophy, Medal, Award, Users, Crown, TrendingUp } from 'lucide-react';
import { getLeaderboard } from '../utils/api';

const Leaderboard = ({ currentUser, onEnterTop3 }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const previousRanksRef = useRef({});

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
        return <Crown className="w-6 h-6 text-[#ffcf66] drop-shadow-[0_0_6px_rgba(255,207,102,0.45)]" />;
      case 2:
        return <Medal className="w-6 h-6 text-[#d6d1cc] drop-shadow-[0_0_4px_rgba(214,209,204,0.35)]" />;
      case 3:
        return <Award className="w-6 h-6 text-[#d18647] drop-shadow-[0_0_4px_rgba(209,134,71,0.4)]" />;
      default:
        return <span className="text-lg font-bold text-[#a87454]">#{rank}</span>;
    }
  };

  const getRankBg = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-[radial-gradient(circle_at_25%_35%,rgba(255,163,54,0.18),transparent_70%),linear-gradient(135deg,#3d2416,#2c1a10)] border-[#ffcf66]/50 shadow-[0_0_24px_-6px_rgba(255,207,102,0.55)]';
      case 2:
        return 'bg-[radial-gradient(circle_at_20%_35%,rgba(214,209,204,0.16),transparent_70%),linear-gradient(135deg,#322018,#24160f)] border-[#d6d1cc]/40 shadow-[0_0_18px_-6px_rgba(214,209,204,0.35)]';
      case 3:
        return 'bg-[radial-gradient(circle_at_22%_35%,rgba(209,134,71,0.14),transparent_70%),linear-gradient(135deg,#3a2215,#2a1810)] border-[#d18647]/45 shadow-[0_0_20px_-6px_rgba(209,134,71,0.45)]';
      default:
        return 'bg-[#160d09]/60 border-[#2f1c12] hover:bg-[#1b100b]/70';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-[#ffcf66] drop-shadow-[0_0_6px_rgba(255,207,102,0.35)]';
    if (score >= 70) return 'text-[#ff9a3c]';
    if (score >= 55) return 'text-[#ff6b00]';
    return 'text-[#d04545]';
  };

  const currentUserRank = leaderboardData.findIndex(entry => entry.uid === currentUser?.uid) + 1;
  useEffect(() => {
    if (currentUserRank > 0 && currentUserRank <= 3 && typeof onEnterTop3 === 'function') {
      onEnterTop3(currentUserRank);
    }
  }, [currentUserRank, onEnterTop3]);

  if (isLoading) {
    return (
      <section className="py-12 px-4 sm:px-6 lg:px-8" id="leaderboard">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 relative">
            <div className="w-20 h-20 bg-[linear-gradient(135deg,#20120c,#2d170f)] border border-[#3a2516] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_16px_-4px_rgba(255,107,0,0.4)]">
              <Trophy className="w-9 h-9 text-[#ff9a3c] drop-shadow-[0_0_6px_rgba(255,154,60,0.6)]" />
            </div>
            <h2 className="font-display text-3xl font-semibold mb-3 heading-gradient tracking-wide">Hall of Masterpieces</h2>
            <p className="text-[#ffb38a]/70 max-w-xl mx-auto text-sm">Forging rankings...</p>
          </div>
          <div className="molten-card backdrop-blur-md rounded-2xl border border-[#3a2516] p-8 shadow-[0_0_26px_-8px_rgba(255,107,0,0.45)]">
            <div className="space-y-4">
              {['s1','s2','s3','s4','s5','s6'].map((k) => (
                <div key={k} className="h-16 rounded-xl bg-[#1d120c]/70 border border-[#2a190f] overflow-hidden relative">
                  <div className="absolute inset-0 animate-pulse bg-[linear-gradient(90deg,rgba(255,107,0,0.05),rgba(255,154,60,0.08),rgba(255,107,0,0.05))]"></div>
                </div>
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
  <section className="py-12 px-4 sm:px-6 lg:px-8" id="leaderboard" aria-labelledby="leaderboard-title">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10 relative">
          <div className="w-20 h-20 bg-[linear-gradient(135deg,#20120c,#2d170f)] border border-[#3a2516] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_16px_-4px_rgba(255,107,0,0.4)]">
            <Trophy className="w-9 h-9 text-[#ff9a3c] drop-shadow-[0_0_6px_rgba(255,154,60,0.6)]" />
          </div>
          <h2 id="leaderboard-title" className="font-display text-3xl font-semibold mb-3 heading-gradient tracking-wide">Hall of Masterpieces</h2>
          <p className="text-[#ffb38a]/70 max-w-xl mx-auto text-sm">Witness molten concepts rising through the forge.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="molten-card backdrop-blur-md rounded-xl p-6 border border-[#3a2516] text-center shadow-[0_0_18px_-6px_rgba(255,107,0,0.4)]">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Users className="w-5 h-5 text-[#ff9a3c]" />
              <span className="text-2xl font-bold text-white">{leaderboardData.length}</span>
            </div>
            <p className="text-xs text-[#c48e6c] tracking-wide uppercase">Participants</p>
          </div>
          
          {currentUserRank > 0 && (
            <div className="molten-card backdrop-blur-md rounded-xl p-6 border border-[#3a2516] text-center shadow-[0_0_18px_-6px_rgba(255,107,0,0.4)]">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 text-[#ff9a3c]" />
                <span className="metric-mono text-2xl font-bold text-white">#{currentUserRank}</span>
              </div>
              <p className="text-xs text-[#c48e6c] tracking-wide uppercase">Your Rank</p>
            </div>
          )}

          {leaderboardData.length > 0 && (
            <div className="molten-card backdrop-blur-md rounded-xl p-6 border border-[#3a2516] text-center shadow-[0_0_18px_-6px_rgba(255,107,0,0.4)]">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                <span className="metric-mono text-2xl font-bold text-white">{leaderboardData[0]?.score || 0}</span>
              </div>
              <p className="text-xs text-[#c48e6c] tracking-wide uppercase">Top Alloy</p>
            </div>
          )}
        </div>

        {/* Leaderboard */}
  <div className="molten-card backdrop-blur-md rounded-2xl border border-[#3a2516] overflow-hidden shadow-[0_0_26px_-8px_rgba(255,107,0,0.45)]" aria-label="Leaderboard rankings">
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
            <div className="divide-y divide-[#2c1b11]">
              {leaderboardData.map((entry, index) => {
                const rank = index + 1;
                const isCurrentUser = entry.uid === currentUser?.uid;
                const prevRank = previousRanksRef.current[entry.uid];
                if (prevRank !== rank) {
                  previousRanksRef.current[entry.uid] = rank;
                }
                const rankShift = prevRank && prevRank !== rank;
                
                const topBar = rank <= 3 ? (
                  <span className={`absolute left-0 top-0 h-full w-1.5 rounded-r-full ${
                    rank === 1 ? 'bg-gradient-to-b from-[#ffcf66] via-[#ff9a3c] to-[#ff6b00]' :
                    rank === 2 ? 'bg-gradient-to-b from-[#d6d1cc] via-[#bfbab5] to-[#8f8a85]' :
                    'bg-gradient-to-b from-[#d18647] via-[#c77638] to-[#a85b24]'
                  }`} aria-hidden="true" />
                ) : null;
                const pulseRing = rank === 1 ? (
                  <span className="absolute -inset-px rounded-xl pointer-events-none animate-pulse bg-[radial-gradient(circle_at_30%_40%,rgba(255,163,54,0.25),transparent_70%)]" aria-hidden="true" />
                ) : null;
                return (
                  <div
                    key={entry.uid}
                    className={`p-6 transition-all duration-300 relative group ${
                      isCurrentUser ? 'border-l-4 border-[#ff6b00]/70 bg-[#1d120c]/70 shadow-[0_0_14px_-4px_rgba(255,107,0,0.5)]' : 'hover:bg-[#1a0f0a]/60'
                    } ${getRankBg(rank)} ${rankShift ? 'animate-pulse' : ''} overflow-hidden focus-ring`}
                    aria-label={`Rank ${rank} ${entry.name} score ${entry.score}`}
                  >
                    {topBar}
                    {pulseRing}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500 bg-[radial-gradient(circle_at_25%_50%,rgba(255,107,0,0.18),transparent_70%)]" />
                    <div className="flex items-center justify-between relative">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 flex items-center justify-center ${rank <=3 ? 'rounded-xl bg-[#26160e]/60 border border-[#3a2516]' : ''}`} aria-hidden="true">
                          {getRankIcon(rank)}
                        </div>
                        <div>
                          <h4 className={`font-semibold tracking-wide ${isCurrentUser ? 'text-[#ffb38a]' : 'text-white'}`}>
                            {entry.name}
                            {isCurrentUser && (
                              <span className="ml-2 text-[10px] bg-[#311e13] border border-[#ff6b00]/30 text-[#ff9a3c] px-2 py-1 rounded-full uppercase tracking-wide">
                                You
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-[#c48e6c]">
                            {entry.branch}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`metric-mono text-2xl font-bold ${getScoreColor(entry.score)}`}>
                          {entry.score}
                        </div>
                        <div className="text-[10px] text-[#a87454] tracking-wide uppercase">/100</div>
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
          <p className="text-[10px] text-[#e6cbb9]/50 tracking-wide uppercase">🔄 Auto-refreshing every few seconds as alloys are tempered</p>
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
  onEnterTop3: PropTypes.func,
};
