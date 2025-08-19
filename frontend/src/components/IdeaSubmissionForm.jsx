import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Send, Lightbulb, AlertCircle, CheckCircle } from 'lucide-react';
import { submitIdeaAsync, getIdeaJobStatus } from '../utils/api';
import { saveFeedback, saveScores } from '../utils/storage';

const IdeaSubmissionForm = ({ userProfile, onSubmissionSuccess }) => {
  const [idea, setIdea] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [jobId, setJobId] = useState(null);
  // Track if the idea has completed evaluation BEFORE any effects reference it
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [progressMsg, setProgressMsg] = useState('Queuing your idea...');
  const progressMessages = useMemo(() => ([
    'Queued for evaluation...',
    'Gathering market signals...',
    'Scanning competitors & feasibility...',
    'Synthesizing context...',
    'Scoring core dimensions...',
    'Generating actionable feedback...'
  ]), []);
  // Rotate messages every few seconds while waiting
  useEffect(() => {
    if (!isSubmitting || isSubmitted) return;
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % progressMessages.length;
      setProgressMsg(progressMessages[idx]);
    }, 3000);
    return () => clearInterval(interval);
  }, [isSubmitting, isSubmitted, progressMessages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (idea.trim().length < 50) {
      setError('Please provide a more detailed idea (at least 50 characters)');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const submissionData = {
      uid: userProfile.uid,
      name: userProfile.name,
      branch: userProfile.branch,
      rollNumber: userProfile.rollNumber,
      idea: idea.trim()
    };

    // Enqueue
    const enqueue = await submitIdeaAsync(submissionData);
    if (!enqueue.success) {
      setError(enqueue.error || 'Failed to enqueue idea.');
      setIsSubmitting(false);
      return;
    }
    setJobId(enqueue.data.jobId);
  setProgressMsg(progressMessages[0]);

    // Poll job status
    const userKey = userProfile.email || userProfile.uid;
    const poll = async () => {
      if (!enqueue.data.jobId) return;
      const statusRes = await getIdeaJobStatus(enqueue.data.jobId);
      if (!statusRes.success) {
        setError(statusRes.error || 'Status check failed');
        setIsSubmitting(false);
        return;
      }
      const { status, result, error: jobError } = statusRes.data;
      if (status === 'error') {
        setError(jobError || 'Evaluation failed');
        setIsSubmitting(false);
        return;
      }
      if (status === 'done' && result) {
        // Persist
        saveFeedback({ feedback: result.feedback }, userKey);
        const scoresPayload = {
          aiRelevance: result.aiRelevance,
          creativity: result.creativity,
          impact: result.impact,
          clarity: result.clarity,
          funFactor: result.funFactor,
          totalScore: result.totalScore,
        };
        saveScores(scoresPayload, userKey);
        setIsSubmitted(true);
        onSubmissionSuccess(result);
        setIsSubmitting(false);
        return;
      }
      // still pending / processing
      setTimeout(poll, 2500);
    };
    poll();
  // Do NOT set isSubmitting false yet; keep loading state until poll resolves
  };

  const characterCount = idea.length;
  const minCharacters = 50;
  const maxCharacters = 1000;

  if (isSubmitted) {
    return (
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="relative overflow-hidden molten-card rounded-2xl p-10 border border-[#3a2516] shadow-[0_0_24px_-6px_rgba(255,107,0,0.5)]">
            <div className="absolute -inset-1 rounded-[inherit] opacity-30 bg-[radial-gradient(circle_at_30%_20%,rgba(255,120,20,0.35),transparent_60%)] blur-xl" />
            <div className="relative text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#1d120c] to-[#2c170e] border border-[#ff6b00]/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_18px_-4px_rgba(255,107,0,0.4)]">
                <CheckCircle className="w-10 h-10 text-[#ff9a3c] drop-shadow-[0_0_6px_rgba(255,154,60,0.5)]" />
              </div>
              <h3 className="font-display text-3xl font-semibold heading-gradient mb-3 tracking-wide">
                Alloy Tempered Successfully!
              </h3>
              <p className="text-[#f7d9c6]/80 leading-relaxed">
                Your concept has passed through the forge. Explore the molten feedback below and watch your rank in the Hall of Masterpieces.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
  <section className="py-12 px-4 sm:px-6 lg:px-8" id="submit" aria-labelledby="submit-title">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10 relative">
          <div className="w-20 h-20 bg-gradient-to-br from-[#20120c] to-[#2d170f] border border-[#3a2516] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[0_0_14px_-2px_rgba(255,107,0,0.4)]">
            <Lightbulb className="w-9 h-9 text-[#ff9a3c] drop-shadow-[0_0_6px_rgba(255,154,60,0.6)]" />
          </div>
          <h2 id="submit-title" className="font-display text-3xl font-semibold mb-3 heading-gradient tracking-wide">
            Submit Your Alloy
          </h2>
          <p className="text-[#ffb38a]/70 max-w-xl mx-auto text-sm">
            Pour your raw concept into the crucible. The forge will temper, score and reflect its potential.
          </p>
        </div>

  <div className="molten-card backdrop-blur-md rounded-2xl p-8 border border-[#3a2516] shadow-[0_0_22px_-6px_rgba(255,107,0,0.45)] relative overflow-hidden tilt-card" aria-describedby="forge-tips">
          <div className="absolute -top-40 -left-32 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(255,107,0,0.22),transparent_65%)] blur-2xl" />
          <div className="absolute -bottom-40 -right-20 w-72 h-72 bg-[radial-gradient(circle_at_center,rgba(255,154,60,0.18),transparent_60%)] blur-2xl" />
          <div className="relative">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Info Display */}
            <div className="rounded-xl p-4 bg-[#1d120c]/70 border border-[#3a2516]">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">{userProfile.name}</h4>
                  <p className="text-sm text-gray-400">
                    {userProfile.rollNumber} • {userProfile.branch}
                  </p>
                </div>
              </div>
            </div>

            {/* Idea Input */}
            <div>
              <label htmlFor="idea" className="block text-sm font-semibold text-[1.44rem] tracking-wide text-[#ffb38a] mb-2">
                Your Concept Alloy
              </label>
              <textarea
                id="idea"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Cast your vision... What problem are you shaping? Who will wield it? What ignites its spark? How will you forge it into reality?"
                rows={10}
                maxLength={maxCharacters}
                className="w-full bg-[#120b07] border border-[#2c1b11] focus:border-[#ff6b00]/40 focus:ring-2 focus:ring-[#ff6b00]/30 rounded-xl px-4 py-4 text-white placeholder-[#845640] focus:placeholder-[#ff9a3c] transition-all duration-300 resize-none shadow-inner"
                required
              />
              
              {/* Character Count */}
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center space-x-2">
                  {characterCount < minCharacters ? (
                    <span className="text-xs text-[#ff5e42] tracking-wide">
                      Minimum {minCharacters} characters required
                    </span>
                  ) : (
                    <span className="text-xs text-[#ffc48a]">
                      Alloy density sufficient
                    </span>
                  )}
                </div>
                <span className={`text-xs ${
                  characterCount > maxCharacters * 0.9 ? 'text-[#ff5e42]' : 'text-[#a87454]'
                }`}>
                  {characterCount}/{maxCharacters}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-[#3a0f0f]/60 border border-red-700/40 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-[#ff5e42] flex-shrink-0" />
                <p className="text-[#ff8a73] text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || characterCount < minCharacters || characterCount > maxCharacters}
              className="hammer-btn focus-ring w-full bg-gradient-to-br from-[#ff6200] via-[#ff4d00] to-[#ffb347] hover:from-[#ff751a] hover:via-[#ff560a] hover:to-[#ffc27a] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_-4px_rgba(255,107,0,0.5)]"
            >
              {isSubmitting ? (
                <>
                  <div className="loading-dots">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                  <span>{progressMsg}</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Strike the Hammer</span>
                </>
              )}
            </button>
            {isSubmitting && (
              <div className="mt-4 flex flex-col items-center justify-center text-[#ffb38a] text-sm animate-pulse space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="mr-1">🔥</span>
                  <span>{progressMsg}</span>
                </div>
                {jobId && <span className="text-xs text-[#ff9a3c]/60">Job ID: {jobId.slice(0,8)}…</span>}
              </div>
            )}
          </form>

          {/* Forge‑themed scoring guidance */}
          <div id="forge-tips" className="mt-8 p-5 rounded-xl border border-[#3a2516] bg-[#140c08]/70" aria-live="polite">
            <h4 className="font-semibold text-[#ffb38a] mb-3 tracking-wide text-sm">Tempering Guide (What We Look For)</h4>
            <ul className="text-xs text-[#c48e6c] space-y-2 leading-relaxed">
              <li>
                <span className="text-[#ff9a3c] font-semibold">Forge Fit (AI Relevance):</span> Does your idea actually need AI, or could a simple app do the same job? Think about what kind of AI you’d use (e.g., chatbot, image generator, recommender system) and why it’s the right tool here.
              </li>
              <li>
                <span className="text-[#ff9a3c] font-semibold">Spark Factor (Creativity):</span> Is there a twist or originality in your idea? Maybe you’re combining AI with a field people don’t usually think about (like farming, fitness, or music), or giving a fresh spin to a common app. One clear, unique angle stands out more than vague claims like “revolutionary” or “next-gen.”
              </li>
              <li>
                <span className="text-[#ff9a3c] font-semibold">Hammer Blow (Impact):</span> Who benefits from your idea, and how big is the difference it makes? Show what problem it solves (saving time, reducing costs, improving access, making life easier), and why people would actually care. The bigger and clearer the benefit, the stronger the hammer blow.
              </li>
              <li>
                <span className="text-[#ff9a3c] font-semibold">Sharpness (Clarity):</span> Can you explain your idea in a clean flow without confusing jargon? A good structure is: Problem → Your AI Solution → Who it helps → Why it works → First steps to build it. If your idea can be understood quickly by both techies and non-techies, it scores high on sharpness.
              </li>
              <li>
                <span className="text-[#ff9a3c] font-semibold">Flare (Fun Factor):</span> Does your idea have something that makes it exciting, memorable, or fun? It could be a playful user experience, a gamified element, or just that “wow” moment that makes people smile. Even serious ideas can have a spark that makes them engaging.
              </li>
            </ul>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
};

export default IdeaSubmissionForm;

IdeaSubmissionForm.propTypes = {
  userProfile: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  email: PropTypes.string,
    branch: PropTypes.string.isRequired,
    rollNumber: PropTypes.string.isRequired,
  }).isRequired,
  onSubmissionSuccess: PropTypes.func.isRequired,
};
