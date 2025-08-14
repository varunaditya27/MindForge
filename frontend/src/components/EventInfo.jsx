import React from 'react';
// no props
import { Lightbulb, Target, Trophy, Zap } from 'lucide-react';

const EventInfo = () => {
  const features = [
    {
      icon: Lightbulb,
      title: "Share Your Idea",
      description: "Submit your innovative business idea"
    },
    {
      icon: Zap,
      title: "AI Evaluation",
      description: "Get instant feedback from Gemini AI"
    },
    {
      icon: Target,
      title: "Focused Scoring",
      description: "5 dimensions (AI relevance, creativity, impact, clarity, fun)"
    },
    {
      icon: Trophy,
      title: "Live Leaderboard",
  description: "Compete live with peers"
    }
  ];

  return (
  <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-dark-900 to-dark-800 rounded-xl">
      <div className="max-w-4xl mx-auto text-center">
        {/* Main Title */}
        <div className="mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Welcome to <span className="heading-gradient">IdeaArena</span>
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Unleash your entrepreneurial spirit! Submit your business ideas and get instant AI-powered evaluation 
            with detailed feedback and scoring.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {features.map((feature) => (
            <div 
              key={feature.title}
              className="bg-dark-800/50 rounded-xl p-6 border border-navy-800 hover:border-navy-600 transition-all duration-300 hover:transform hover:scale-105 card-glow"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-navy-500/20 rounded-full mb-4">
                  <feature.icon className="w-6 h-6 text-navy-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-400">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Scoring Information */}
        <div className="bg-navy-900/30 rounded-xl p-6 border border-navy-700 card-glow">
          <h3 className="text-xl font-semibold text-white mb-4">How Your Idea Is Scored</h3>
          <p className="text-gray-300 text-sm mb-4">Each dimension is scored 0–100. Total score is the average of the five.</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center text-gray-300 text-sm">
            <div>AI Relevance</div>
            <div>Creativity</div>
            <div>Impact</div>
            <div>Clarity</div>
            <div>Fun / Wow</div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8">
          <p className="text-gray-400 text-sm">
            Ready to showcase your innovation? Scroll down to submit your idea!
          </p>
        </div>
      </div>
    </section>
  );
};

export default EventInfo;
