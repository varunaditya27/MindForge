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
  const [progressMsg, setProgressMsg] = useState('Queuing your idea...');
  const progressMessages = useMemo(() => ([
    'Queued for evaluation...',
    'Gathering market signals...',
    'Scanning competitors & feasibility...',
    'Synthesizing context...',
  'Scoring core dimensions...',
    'Generating actionable feedback...',
    'Finalizing JSON response...'
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
  const [isSubmitted, setIsSubmitted] = useState(false);

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

    setIsSubmitting(false);
  };

  const characterCount = idea.length;
  const minCharacters = 50;
  const maxCharacters = 1000;

  if (isSubmitted) {
    return (
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">
              Idea Submitted Successfully!
            </h3>
            <p className="text-gray-300">
              Your idea has been evaluated by AI. Check your feedback below and see how you rank on the leaderboard!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8" id="submit">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-navy-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="w-8 h-8 text-navy-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2 heading-gradient">
            Submit Your Idea
          </h2>
          <p className="text-gray-400">
            Share your innovative business idea and get instant AI feedback
          </p>
        </div>

        <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-8 border border-navy-800 card-glow">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Info Display */}
            <div className="bg-dark-700/50 rounded-xl p-4">
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
              <label htmlFor="idea" className="block text-sm font-medium text-gray-300 mb-2">
                Your Business Idea
              </label>
              <textarea
                id="idea"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Describe your innovative business idea in detail. What problem does it solve? Who is your target audience? What makes it unique? How would you implement it?"
                rows={10}
                maxLength={maxCharacters}
                className="w-full bg-dark-700 border border-navy-700 rounded-xl px-4 py-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all duration-200 resize-none shadow-inner"
                required
              />
              
              {/* Character Count */}
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center space-x-2">
                  {characterCount < minCharacters ? (
                    <span className="text-xs text-red-400">
                      Minimum {minCharacters} characters required
                    </span>
                  ) : (
                    <span className="text-xs text-green-400">
                      Great! Your idea is detailed enough
                    </span>
                  )}
                </div>
                <span className={`text-xs ${
                  characterCount > maxCharacters * 0.9 ? 'text-red-400' : 'text-gray-500'
                }`}>
                  {characterCount}/{maxCharacters}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || characterCount < minCharacters || characterCount > maxCharacters}
              className="w-full bg-gradient-to-r from-navy-600 to-navy-500 hover:from-navy-500 hover:to-navy-400 text-white font-medium py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-navy-900/30"
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
                  <span>Submit for AI Evaluation</span>
                </>
              )}
            </button>
            {isSubmitting && (
              <div className="mt-4 flex flex-col items-center justify-center text-navy-300 text-sm animate-pulse space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="mr-1">🤖</span>
                  <span>{progressMsg}</span>
                </div>
                {jobId && <span className="text-xs text-navy-400/70">Job ID: {jobId.slice(0,8)}…</span>}
              </div>
            )}
          </form>

          {/* Tips */}
          <div className="mt-6 p-4 bg-navy-900/30 rounded-xl border border-navy-700 card-glow">
            <h4 className="font-medium text-white mb-2">💡 Tips for a Great Submission:</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Be specific about the problem you're solving</li>
              <li>• Explain your target audience clearly</li>
              <li>• Describe what makes your idea unique</li>
              <li>• Include your implementation strategy</li>
              <li>• Consider the market potential and scalability</li>
            </ul>
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
