import React from 'react';
import PropTypes from 'prop-types';
import { Brain, TrendingUp, Zap, Target, Star, MessageSquare, Users, Award } from 'lucide-react';

const FeedbackCard = ({ feedback, scores }) => {
  if (!feedback || !scores) {
    return null;
  }

  const criteria = [
    { key: 'problemClarity', icon: MessageSquare, title: 'Problem Clarity', description: 'Clarity and specificity of problem', color: 'text-teal-400', bgColor: 'bg-teal-500/20' },
    { key: 'originality', icon: Star, title: 'Originality', description: 'Novelty and differentiation', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
    { key: 'feasibility', icon: Target, title: 'Feasibility', description: 'Technical and practical feasibility', color: 'text-green-400', bgColor: 'bg-green-500/20' },
    { key: 'technicalComplexity', icon: Brain, title: 'Technical Complexity', description: 'Depth of technical approach', color: 'text-sky-400', bgColor: 'bg-sky-500/20' },
    { key: 'scalability', icon: TrendingUp, title: 'Scalability', description: 'Growth potential and scale', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    { key: 'marketSize', icon: Users, title: 'Market Size', description: 'Size and reach of target market', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
    { key: 'businessModel', icon: Award, title: 'Business Model', description: 'Clarity and viability of monetization', color: 'text-fuchsia-400', bgColor: 'bg-fuchsia-500/20' },
    { key: 'impact', icon: Zap, title: 'Impact', description: 'Expected user/societal impact', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
    { key: 'executionPlan', icon: TrendingUp, title: 'Execution Plan', description: 'Roadmap and MVP readiness', color: 'text-indigo-400', bgColor: 'bg-indigo-500/20' },
    { key: 'riskMitigation', icon: Target, title: 'Risk Mitigation', description: 'Awareness and mitigation of risks', color: 'text-rose-400', bgColor: 'bg-rose-500/20' },
  ];

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 55) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score) => {
    if (score >= 85) return 'bg-green-500/20';
    if (score >= 70) return 'bg-yellow-500/20';
    if (score >= 55) return 'bg-orange-500/20';
    return 'bg-red-500/20';
  };

  const getOverallLabel = (total) => {
    if (total >= 85) return 'Excellent';
    if (total >= 70) return 'Very Good';
    if (total >= 55) return 'Good';
    return 'Needs Improvement';
  };

  const barGradient = (score) => {
    if (score >= 85) return 'from-green-500 to-green-400';
    if (score >= 70) return 'from-yellow-500 to-yellow-400';
    if (score >= 55) return 'from-orange-500 to-orange-400';
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
              out of 100 points
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
                    <div className="text-gray-500 text-sm">/ 10</div>
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
                const percentage = Math.max(0, Math.min(100, score));
                
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
                    <div className={`w-10 text-sm font-medium ${getScoreColor(score)}`}>
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
    problemClarity: PropTypes.number,
    originality: PropTypes.number,
    feasibility: PropTypes.number,
    technicalComplexity: PropTypes.number,
    scalability: PropTypes.number,
    marketSize: PropTypes.number,
    businessModel: PropTypes.number,
    impact: PropTypes.number,
    executionPlan: PropTypes.number,
    riskMitigation: PropTypes.number,
    totalScore: PropTypes.number,
  }),
};
