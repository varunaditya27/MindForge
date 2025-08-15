import React, { useEffect, useState } from 'react';

const FACTS = [
  'The term “artificial intelligence” was coined in 1956 at the Dartmouth Conference.',
  'Transformer models (like those behind modern AI) were introduced in 2017.',
  'AI can detect diabetic retinopathy from eye images with high accuracy.',
  'Reinforcement learning teaches agents by rewarding good actions.',
  'Fine-tuning lets AI adapt to new tasks using smaller datasets.',
  'Large Language Models predict the next token using probabilities.',
  'Gradient descent is the core algorithm used to train neural networks.',
  'Convolutional neural networks excel at image recognition tasks.',
];

const AIFunFactBar = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % FACTS.length);
    }, 7000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mt-4 relative rounded-xl overflow-hidden backdrop-blur-md border border-[#3a2516] bg-gradient-to-r from-[#140a06]/85 via-[#1b0f0a]/90 to-[#140804]/85 shadow-[0_0_18px_-6px_rgba(255,107,0,0.35)]">
          <div className="absolute inset-0 pointer-events-none opacity-40 bg-[linear-gradient(110deg,rgba(255,128,48,0.25),rgba(255,159,64,0)_50%)]" />
          <div className="relative px-4 py-3 text-sm flex items-center gap-3">
            <span className="font-display text-[13px] font-semibold bg-clip-text text-transparent heading-gradient tracking-wide whitespace-nowrap">Forge Fact</span>
            <span key={index} className="text-soft transition-opacity duration-700 ease-in-out inline-block">
              {FACTS[index]}
            </span>
            <span className="ml-auto w-2 h-2 rounded-full bg-[#ff9f40] animate-pulse shadow-[0_0_6px_2px_rgba(255,159,64,0.6)]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIFunFactBar;
