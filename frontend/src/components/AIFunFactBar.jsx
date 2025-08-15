import React, { useEffect, useState } from 'react';

// Beginner-friendly, awe-inspiring AI facts (plain language, minimal jargon)
const FACTS = [
  'An early Google experiment once let a big neural network watch YouTube frames and it learned what a cat was—without anyone telling it “this is a cat.”',
  'AI can now predict 3D shapes of many human proteins, helping biologists skip months of trial-and-error in the lab.',
  'Small AI models can run fully offline on tiny chips (no internet) — powering smart sensors and wearables silently.',
  'Some game‑playing AIs learn only by trying things and scoring points, just like a beginner practicing and noticing what works.',
  'Modern language AIs were never taught grammar rules directly, yet they still “discover” patterns that let them write smoothly.',
  'Special “mixture” models wake up only a few of their parts each time you type, saving energy while feeling huge in capability.',
  'A new 3D technique can rebuild a virtual scene from a short phone video, letting you “walk around” a memory later.',
  'Edge AI means your phone can translate speech or classify images instantly—even with airplane mode on.',
  'Some vision AIs once relied on tiny camera quirks (like dust specks) by accident—so researchers had to retrain them to focus on real objects.',
  'Some phone cameras already use small AI models to clean up grainy night photos before you ever see them.',
  'AI can spot tiny cracks in wind turbine blades from drone images, helping prevent breakdowns.',
  'Voice assistants turn sound waves into numbers, patterns, then words—in less than a blink.',
  'A smart keyboard guesses your next word using patterns learned from millions of sentences.',
  'AI can turn a rough doodle into a cleaner drawing by learning what common shapes usually mean.',
  'A translation AI builds a shared “meaning space” so it can jump between languages without a dictionary.',
  'Robot arms now use vision AI to pick mixed objects from cluttered bins—once thought “too messy.”',
  'AI-boosted weather tools can sharpen short-term rain alerts for safer events.',
  'AI can read messy handwritten notes almost like a patient teacher.',
  'Recommendation AIs can guess your taste after just a few clicks—and adapt as you change.',
  'Synthetic medical images made by AI help train doctors without exposing real patient data.',
];

const AIFunFactBar = () => {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0..100 visual timer

  const INTERVAL_MS = 8000;

  // Cycle facts with timeout (allows precise reset for progress bar)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIndex((i) => (i + 1) % FACTS.length);
    }, INTERVAL_MS);
    return () => clearTimeout(timeout);
  }, [index]);

  // Animate progress bar smoothly
  useEffect(() => {
    setProgress(0);
    const started = performance.now();
    let frameId;
    const tick = (now) => {
      const elapsed = now - started;
      const pct = Math.min(100, (elapsed / INTERVAL_MS) * 100);
      setProgress(pct);
      if (pct < 100) frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [index]);

  return (
    <div className="sticky top-0 z-40 w-full">
      {/* Removed outer max-width + padding to eliminate large left gap. Internal padding tightened. */}
      <div className="mt-4 relative rounded-xl overflow-hidden backdrop-blur-md border border-[#3a2516] bg-gradient-to-r from-[#140a06]/85 via-[#1b0f0a]/90 to-[#140804]/85 shadow-[0_0_18px_-6px_rgba(255,107,0,0.35)] w-full">
        {/* Subtle moving sheen */}
        <div className="absolute inset-0 pointer-events-none opacity-25 bg-[linear-gradient(110deg,rgba(255,140,40,0.28),rgba(255,159,64,0)_55%)] animate-pulse" />
        <div className="relative py-2.5 pl-3 pr-4 md:pl-4 md:pr-6 text-sm flex items-center gap-3 select-none">
          <span className="font-display text-[13px] font-semibold bg-clip-text text-transparent heading-gradient tracking-wide whitespace-nowrap shrink-0">Forge Fact</span>
          <span
            key={index}
            className="text-[#e9d5c7] animate-fade-in will-change-transform inline-block"
          >
            {FACTS[index]}
          </span>
          <span className="ml-auto w-2 h-2 rounded-full bg-[#ff9f40] animate-pulse shadow-[0_0_6px_2px_rgba(255,159,64,0.6)]" />
        </div>
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 h-0.5 w-full bg-[#3a2516]/60 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#ff6b00] via-[#ff9a3c] to-[#ffcf66] transition-[width] duration-150 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default AIFunFactBar;
