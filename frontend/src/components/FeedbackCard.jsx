import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Flame, Zap, Star, MessageSquare, Sparkles, ClipboardCopy, Check } from 'lucide-react';

const FeedbackCard = ({ feedback, scores }) => {
  // Animated overall score reveal
  const [displayScore, setDisplayScore] = useState(0);
  const [metricDisplay, setMetricDisplay] = useState({});
  const [copied, setCopied] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(true);

  // Animate overall score when scores change
  useEffect(() => {
    if (!scores?.totalScore || !motionEnabled) { setDisplayScore(scores?.totalScore || 0); return; }
    let frame;
    const start = performance.now();
    const duration = 1200;
    const target = scores.totalScore || 0;
    const animate = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [scores?.totalScore, motionEnabled]);

  // Animate each metric (lightweight RAF loop)
  useEffect(() => {
    if (!scores) return;
    if (!motionEnabled) { setMetricDisplay({
      aiRelevance: scores.aiRelevance,
      creativity: scores.creativity,
      impact: scores.impact,
      clarity: scores.clarity,
      funFactor: scores.funFactor
    }); return; }
    const metricKeys = ['aiRelevance','creativity','impact','clarity','funFactor'];
    let frame;
    const start = performance.now();
    const duration = 1000;
    const animate = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = {};
      metricKeys.forEach(k => {
        const target = scores[k] || 0;
        next[k] = Math.round(target * eased);
      });
      setMetricDisplay(next);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [scores, motionEnabled]);

  const criteria = [
    { key: 'aiRelevance', icon: Flame, title: 'Forge Fit', description: 'How well AI is integrated', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
    { key: 'creativity', icon: Star, title: 'Spark Factor', description: 'Original twist / novelty', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
    { key: 'impact', icon: Zap, title: 'Hammer Blow', description: 'Strength of real-world effect', color: 'text-red-400', bgColor: 'bg-red-500/20' },
    { key: 'clarity', icon: MessageSquare, title: 'Sharpness', description: 'Precision & structure', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    { key: 'funFactor', icon: Sparkles, title: 'Flare', description: 'Memorability & delight', color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
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

  const copyFeedback = async () => {
    try {
      await navigator.clipboard.writeText(feedback.feedback || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard failure
    }
  };

  const toggleMotion = () => setMotionEnabled(m => !m);
  const getOverallLabel = (total) => {
    if (total >= 85) return 'Excellent';
    if (total >= 70) return 'Very Good';
    if (total >= 55) return 'Good';
    return 'Needs Improvement';
  };


  if (!feedback || !scores) return null;

  return (
  <section className="py-12 px-4 sm:px-6 lg:px-8" id="feedback" aria-labelledby="feedback-title">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-navy-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Flame className="w-8 h-8 text-orange-400" />
          </div>
  <h2 id="feedback-title" className="font-display text-3xl font-semibold text-white mb-2 heading-gradient">
            Tempering Results
          </h2>
          <p className="text-gray-400">
            Your concept has been tempered by AI reasoning
          </p>
        </div>

        <div className="space-y-8">
          {/* Overall Score */}
          <div className="molten-card backdrop-blur-md rounded-2xl p-8 border border-[#3a2516] text-center shadow-[0_0_24px_-8px_rgba(255,107,0,0.5)] relative overflow-hidden tilt-card" aria-describedby="overall-label">
            <h3 className="font-display text-xl font-semibold text-white mb-4">
              Forge Alloy Score
            </h3>
            <div className={`metric-mono text-6xl font-bold mb-2 ${getScoreColor(scores.totalScore)} tabular-nums`}>
              {displayScore}
            </div>
            <div className="text-[#c48e6c] text-xs tracking-wide uppercase">Total / 100</div>
            <div className={`inline-block px-4 py-2 rounded-full mt-4 ${getScoreBgColor(scores.totalScore)}`}>
              <span className={`font-medium ${getScoreColor(scores.totalScore)}`}>
                {getOverallLabel(scores.totalScore)}
              </span>
            </div>
          </div>

          {/* Detailed Scores */}
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6" aria-label="Individual metric scores">
            {criteria.map((criterion) => {
              const score = scores[criterion.key];
              const IconComponent = criterion.icon;
              
              return (
                <li
                  key={criterion.key}
                  className="molten-card backdrop-blur-md rounded-xl p-6 border border-[#3a2516] shadow-[0_0_18px_-6px_rgba(255,107,0,0.4)] relative overflow-hidden tilt-card focus-ring" aria-label={`${criterion.title} score ${score} of 100`}
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
                    <div className={`metric-mono text-3xl font-bold ${getScoreColor(score)} tabular-nums`}>
                      {metricDisplay[criterion.key] ?? 0}
                    </div>
                    <div className="text-gray-500 text-sm">/ 100</div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* AI Feedback */}
          <div className="molten-card backdrop-blur-md rounded-2xl p-8 border border-[#3a2516] shadow-[0_0_22px_-8px_rgba(255,107,0,0.45)] relative overflow-hidden">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-navy-500/20 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-navy-400" />
              </div>
              <h3 className="font-display text-xl font-semibold text-white flex-1">
                AI Feedback
              </h3>
              <div className="flex items-center gap-2">
                <button type="button" onClick={copyFeedback} className={`copy-btn focus-ring ${copied ? 'copied' : ''}`} aria-live="polite">
                  {copied ? <Check className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button type="button" onClick={toggleMotion} className="effects-toggle copy-btn focus-ring !px-2" aria-pressed={motionEnabled} title="Toggle animations">
                  {motionEnabled ? 'Motion: On' : 'Motion: Off'}
                </button>
              </div>
            </div>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {feedback.feedback}
              </p>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="molten-card backdrop-blur-md rounded-2xl p-8 border border-[#3a2516] shadow-[0_0_22px_-8px_rgba(255,107,0,0.45)] relative overflow-hidden">
            <h3 className="font-display text-xl font-semibold text-white mb-6 text-center">
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
                      <div className="gauge-track">
                        <div 
                          className="gauge-fill transition-all duration-[1400ms] ease-out"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className={`metric-mono w-10 text-sm font-medium ${getScoreColor(score)}`}>
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
    aiRelevance: PropTypes.number,
    creativity: PropTypes.number,
    impact: PropTypes.number,
    clarity: PropTypes.number,
    funFactor: PropTypes.number,
    totalScore: PropTypes.number,
  }),
};
