import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Flame, Zap, Star, MessageSquare, Sparkles, ClipboardCopy, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

const FeedbackCard = ({ feedback, scores }) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [metricDisplay, setMetricDisplay] = useState({});
  const [copied, setCopied] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(true);
  const navigate = useNavigate();

  // Animate total score
  useEffect(() => {
    if (!scores?.totalScore || !motionEnabled) {
      setDisplayScore(scores?.totalScore || 0);
      return;
    }
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

  // Animate each metric
  useEffect(() => {
    if (!scores) return;
    if (!motionEnabled) {
      setMetricDisplay({ ...scores });
      return;
    }
    const metricKeys = ["aiRelevance", "creativity", "impact", "clarity", "funFactor"];
    let frame;
    const start = performance.now();
    const duration = 1000;
    const animate = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = {};
      metricKeys.forEach((k) => {
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
    { key: "aiRelevance", icon: Flame, title: "Forge Fit", description: "How well AI is integrated", color: "text-orange-400", bgColor: "bg-orange-500/20" },
    { key: "creativity", icon: Star, title: "Spark Factor", description: "Original twist / novelty", color: "text-amber-400", bgColor: "bg-amber-500/20" },
    { key: "impact", icon: Zap, title: "Hammer Blow", description: "Strength of real-world effect", color: "text-red-400", bgColor: "bg-red-500/20" },
    { key: "clarity", icon: MessageSquare, title: "Sharpness", description: "Precision & structure", color: "text-blue-400", bgColor: "bg-blue-500/20" },
    { key: "funFactor", icon: Sparkles, title: "Flare", description: "Memorability & delight", color: "text-pink-400", bgColor: "bg-pink-500/20" },
  ];

  const getScoreColor = (score) => {
    if (score >= 85) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    if (score >= 55) return "text-orange-400";
    return "text-red-400";
  };

  const getScoreBgColor = (score) => {
    if (score >= 85) return "bg-green-500/20";
    if (score >= 70) return "bg-yellow-500/20";
    if (score >= 55) return "bg-orange-500/20";
    return "bg-red-500/20";
  };

  const copyFeedback = async () => {
    try {
      await navigator.clipboard.writeText(feedback.feedback || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const toggleMotion = () => setMotionEnabled((m) => !m);

  const getOverallLabel = (total) => {
    if (total >= 85) return "Excellent";
    if (total >= 70) return "Very Good";
    if (total >= 55) return "Good";
    return "Needs Improvement";
  };

  if (!feedback || !scores) return null;

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8" id="feedback">
      <div className="max-w-4xl mx-auto">
        {/* ... your existing score & feedback UI ... */}
      </div>

      {/* Floating Chat Button (current tab) */}
      <div className="fixed right-4 bottom-4 flex flex-col items-center z-50">
        <button
          onClick={() => navigate("/chat")}
          className="w-16 h-16 bg-gradient-to-br from-orange-500 via-orange-600 to-yellow-500 
            text-white rounded-full shadow-[0_0_20px_rgba(255,120,0,0.9)] 
            flex items-center justify-center text-2xl 
            hover:scale-110 hover:shadow-[0_0_25px_rgba(255,150,50,1)] 
            transition-all duration-300"
          title="Chat with AI"
        >
          💬
        </button>
      </div>
    </section>
  );
};

FeedbackCard.propTypes = {
  feedback: PropTypes.shape({ feedback: PropTypes.string }),
  scores: PropTypes.shape({
    aiRelevance: PropTypes.number,
    creativity: PropTypes.number,
    impact: PropTypes.number,
    clarity: PropTypes.number,
    funFactor: PropTypes.number,
    totalScore: PropTypes.number,
  }),
};

export default FeedbackCard;
