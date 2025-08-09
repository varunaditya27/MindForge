import React from 'react';
import PropTypes from 'prop-types';
import { Brain, TrendingUp, Zap, Target, Star, MessageSquare } from 'lucide-react';

const FeedbackCard = ({ feedback, scores }) => {
  if (!feedback || !scores) {
    return null;
  }

  const criteria = [
    {
      key: 'feasibility',
      icon: Target,
      title: 'Feasibility',
      description: 'How realistic and achievable is your idea?',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      key: 'originality',
      icon: Star,
      title: 'Originality',
      description: 'How unique and innovative is your concept?',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    },
    {
      key: 'scalability',
      icon: TrendingUp,
      title: 'Scalability',
      description: 'Can your idea grow and expand effectively?',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    {
      key: 'impact',
      icon: Zap,
      title: 'Impact',
      description: 'What positive change will your idea create?',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20'
    }
  ];

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    if (score >= 4) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score) => {
    if (score >= 8) return 'bg-green-500/20';
    if (score >= 6) return 'bg-yellow-500/20';
    if (score >= 4) return 'bg-orange-500/20';
    return 'bg-red-500/20';
  };

  const getOverallLabel = (total) => {
    if (total >= 32) return 'Excellent';
    if (total >= 24) return 'Very Good';
    if (total >= 16) return 'Good';
    return 'Needs Improvement';
  };

  const barGradient = (score) => {
    if (score >= 8) return 'from-green-500 to-green-400';
    if (score >= 6) return 'from-yellow-500 to-yellow-400';
    if (score >= 4) return 'from-orange-500 to-orange-400';
    return 'from-red-500 to-red-400';
  };

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8" id="feedback">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-navy-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-navy-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2 heading-gradient">
            AI Evaluation Results
          </h2>
          <p className="text-gray-400">
            Here's how our AI evaluated your business idea
          </p>
        </div>

        <div className="space-y-8">
          {/* Overall Score */}
          <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-8 border border-navy-800 text-center card-glow">
            <h3 className="text-xl font-semibold text-white mb-4">
              Overall Score
            </h3>
            <div className={`text-6xl font-bold mb-2 ${getScoreColor(scores.totalScore)}`}>
              {scores.totalScore}
            </div>
            <div className="text-gray-400 text-sm">
              out of 40 points
            </div>
            <div className={`inline-block px-4 py-2 rounded-full mt-4 ${getScoreBgColor(scores.totalScore)}`}>
              <span className={`font-medium ${getScoreColor(scores.totalScore)}`}>
                {getOverallLabel(scores.totalScore)}
              </span>
            </div>
          </div>

          {/* Detailed Scores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {criteria.map((criterion) => {
              const score = scores[criterion.key];
              const IconComponent = criterion.icon;
              
              return (
                <div 
                  key={criterion.key}
                  className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-navy-800 card-glow"
                >
                  <div className="text-center">
                    <div className={`w-12 h-12 ${criterion.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <IconComponent className={`w-6 h-6 ${criterion.color}`} />
                    </div>
                    <h4 className="font-semibold text-white mb-1">
                      {criterion.title}
                    </h4>
                    <p className="text-xs text-gray-400 mb-3">
                      {criterion.description}
                    </p>
                    <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
                      {score}
                    </div>
                    <div className="text-gray-500 text-sm">
                      / 10
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Feedback */}
          <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-8 border border-navy-800 card-glow">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-navy-500/20 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-navy-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">
                AI Feedback
              </h3>
            </div>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {feedback.feedback}
              </p>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-8 border border-navy-800 card-glow">
            <h3 className="text-xl font-semibold text-white mb-6 text-center">
              Score Breakdown
            </h3>
            <div className="space-y-4">
              {criteria.map((criterion) => {
                const score = scores[criterion.key];
                const percentage = (score / 10) * 100;
                
                return (
                  <div key={criterion.key} className="flex items-center space-x-4">
                    <div className="w-20 text-sm text-gray-400">
                      {criterion.title}
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${barGradient(score)} transition-all duration-1000 ease-out`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className={`w-8 text-sm font-medium ${getScoreColor(score)}`}>
                      {score}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeedbackCard;

FeedbackCard.propTypes = {
  feedback: PropTypes.shape({
    feedback: PropTypes.string,
  }),
  scores: PropTypes.shape({
    feasibility: PropTypes.number,
    originality: PropTypes.number,
    scalability: PropTypes.number,
    impact: PropTypes.number,
    totalScore: PropTypes.number,
  }),
};
