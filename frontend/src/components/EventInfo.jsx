import React from 'react';
// no props
import { Flame, Target, Trophy, Zap } from 'lucide-react';

const EventInfo = () => {
  const features = [
    {
      icon: Flame,
      title: "Cast Your Vision",
      description: "Submit your raw concept to begin forging"
    },
    {
      icon: Zap,
      title: "Tempering by AI",
      description: "AI infuses insight & refines potential"
    },
    {
      icon: Target,
      title: "Forge Metrics",
      description: "5 dimensions (Forge Fit, Spark, Hammer Blow, Sharpness, Flare)"
    },
    {
      icon: Trophy,
      title: "Hall of Masterpieces",
      description: "Rise through the molten ranks"
    }
  ];

  return (
  <section className="py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden" aria-labelledby="eventinfo-title">
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_20%_30%,rgba(255,107,0,0.25),transparent_60%),radial-gradient(circle_at_80%_70%,rgba(255,154,60,0.18),transparent_65%)]" />
      <div className="max-w-5xl mx-auto text-center relative">
        {/* Main Title */}
        <div className="mb-14">
          <h2 id="eventinfo-title" className="font-display text-3xl sm:text-5xl font-semibold mb-5 tracking-wide">
            Welcome to <span className="heading-gradient">MindForge</span>
          </h2>
          <p className="text-base sm:text-lg text-[#ffb38a]/80 max-w-3xl mx-auto leading-relaxed">
            Where raw creativity is tempered into innovation. Submit your concept and watch AI heat, hammer, and hone it into a sharper alloy of possibility.
          </p>
        </div>

        {/* Features Grid */}
  <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
          {features.map((feature) => (
            <li
              key={feature.title}
              className="relative molten-card rounded-2xl px-6 py-8 border border-[#3a2516] shadow-[0_0_18px_-6px_rgba(255,107,0,0.4)] overflow-hidden group backdrop-blur-md tilt-card"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_30%,rgba(255,107,0,0.25),transparent_70%)]" />
              <div className="flex flex-col items-center text-center relative">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 bg-[#1d120c] border border-[#3a2516] shadow-[0_0_12px_-2px_rgba(255,107,0,0.35)]">
                  <feature.icon className="w-7 h-7 text-[#ff9a3c] drop-shadow-[0_0_6px_rgba(255,154,60,0.6)]" />
                </div>
                <h3 className="font-semibold text-white mb-2 tracking-wide text-[1.15rem]">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#c48e6c] leading-relaxed">
                  {feature.description}
                </p>
              </div>
      </li>
          ))}
    </ul>

        {/* Scoring Information */}
        <div className="molten-card rounded-2xl p-8 border border-[#3a2516] shadow-[0_0_20px_-8px_rgba(255,107,0,0.45)] backdrop-blur-md relative overflow-hidden">
          <div className="absolute -top-32 -left-20 w-72 h-72 bg-[radial-gradient(circle_at_center,rgba(255,120,20,0.22),transparent_65%)] blur-2xl" />
          <div className="absolute -bottom-36 -right-16 w-80 h-80 bg-[radial-gradient(circle_at_center,rgba(255,154,60,0.18),transparent_65%)] blur-2xl" />
          <div className="relative">
            <h3 className="font-semibold mb-5 heading-gradient text-[1.44rem]">Forge Metric System</h3>
            <p className="text-[#ffb38a]/70 text-base mb-6">Each metric is tempered 0–100. Total is the alloy average.</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center text-[#c48e6c] text-sm tracking-wide uppercase">
              <div>Forge Fit</div>
              <div>Spark Factor</div>
              <div>Hammer Blow</div>
              <div>Sharpness</div>
              <div>Flare</div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-10">
          <p className="text-[11px] text-[#e6cbb9]/50 tracking-wide uppercase">
            Ready to forge? Scroll down and cast your alloy.
          </p>
        </div>
      </div>
    </section>
  );
};

export default EventInfo;
