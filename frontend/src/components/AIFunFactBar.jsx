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
    <div className="sticky top-0 z-30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mt-4 rounded-xl bg-navy-900/40 border border-navy-800 backdrop-blur-md p-3 overflow-hidden">
          <div className="text-sm text-navy-200 transition-all duration-700 ease-in-out">
            <span className="font-semibold text-navy-300 mr-2">AI Fun Fact:</span>
            <span key={index}>{FACTS[index]}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIFunFactBar;
