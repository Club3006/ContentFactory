/**
 * OutputRating Component
 * 
 * Displays generated content with a 5-star rating system and feedback input
 * for iterative refinement. Shows iteration count and final output badge.
 * Saves ratings to database for CopyPro learning system.
 */

import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Copy, 
  CheckCircle, 
  RefreshCw, 
  Loader2, 
  Award,
  MessageSquare
} from 'lucide-react';
import { CopyProValidation } from '../prompts/copyPro';
import { db } from '../db/db';
import { ContentRating } from '../types';

interface OutputRatingProps {
  content: string;
  validation?: CopyProValidation;
  iteration: number;
  onRefine: (rating: number, feedback: string) => void;
  isRefining: boolean;
  // Context for saving ratings
  format?: 'post' | 'article' | 'carousel' | 'video-script' | 'ic-memo';
  platform?: 'linkedin' | 'youtube' | 'instagram' | 'twitter';
  contentType?: 'linkedin' | 'generator';
  sourcePackSummary?: string;
}

export const OutputRating: React.FC<OutputRatingProps> = ({
  content,
  validation,
  iteration,
  onRefine,
  isRefining,
  format = 'post',
  platform = 'linkedin',
  contentType = 'linkedin',
  sourcePackSummary = ''
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [copied, setCopied] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [ratingSaved, setRatingSaved] = useState(false);

  const isFinal = rating === 5;
  const displayRating = hoverRating || rating;

  // Save rating to database when user submits (refine or final)
  const saveRating = async (ratingValue: number, feedbackText: string, isFinalOutput: boolean) => {
    try {
      const ratingRecord: ContentRating = {
        contentType,
        format,
        rating: ratingValue,
        feedback: feedbackText,
        sourcePackSummary: sourcePackSummary.substring(0, 500),
        outputSample: content.substring(0, 500),
        finalOutput: isFinalOutput ? content : undefined,
        platform,
        createdAt: Date.now()
      };
      
      await db.contentRatings.add(ratingRecord);
      console.log('[CopyPro] Rating saved:', { rating: ratingValue, isFinal: isFinalOutput });
      setRatingSaved(true);
    } catch (error) {
      console.error('Failed to save rating:', error);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefine = async () => {
    if (rating === 0) return;
    // Save the rating before refining
    await saveRating(rating, feedback, false);
    onRefine(rating, feedback);
    setFeedback('');
    setRating(0);
    setRatingSaved(false);
  };

  // When user rates 5 stars (final), save immediately
  useEffect(() => {
    if (rating === 5 && !ratingSaved) {
      saveRating(5, 'Perfect output - no changes needed', true);
    }
  }, [rating]);

  // Get rating label
  const getRatingLabel = (r: number): string => {
    switch (r) {
      case 1: return 'Major issues - significant rewrite needed';
      case 2: return 'Needs work - multiple areas to improve';
      case 3: return 'Decent - some targeted improvements needed';
      case 4: return 'Good - minor polish required';
      case 5: return 'Excellent - ready to publish!';
      default: return 'Rate this output';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with iteration count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
            Generated Output
          </span>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
            Iteration {iteration}
          </span>
          {isFinal && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <Award size={10} />
              Final
            </span>
          )}
        </div>
        
        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
            copied
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          {copied ? (
            <>
              <CheckCircle size={12} />
              Copied!
            </>
          ) : (
            <>
              <Copy size={12} />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Content Display */}
      <div className={`relative rounded-lg border p-4 ${
        isFinal 
          ? 'border-emerald-500/30 bg-emerald-500/5' 
          : 'border-slate-700 bg-slate-900'
      }`}>
        <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-mono max-h-96 overflow-y-auto custom-scrollbar select-text cursor-text">
          {content}
        </div>
      </div>

      {/* Validation Block (collapsible) */}
      {validation && (
        <div className="space-y-2">
          <button
            onClick={() => setShowValidation(!showValidation)}
            className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-400 transition-colors"
          >
            <CheckCircle size={12} />
            CopyPro Validation
            <span className="text-slate-600">{showValidation ? '▼' : '▶'}</span>
          </button>
          
          {showValidation && (
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 space-y-2 text-xs">
              <div>
                <span className="text-slate-500">1. Assumption invalidated: </span>
                <span className="text-slate-300">{validation.assumptionInvalidated}</span>
              </div>
              <div>
                <span className="text-slate-500">2. Supporting data: </span>
                <span className="text-slate-300">{validation.dataSupport}</span>
              </div>
              <div>
                <span className="text-slate-500">3. Decision to reconsider: </span>
                <span className="text-slate-300">{validation.decisionToReconsider}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rating Section */}
      {!isFinal && (
        <div className="space-y-3 pt-4 border-t border-white/5">
          {/* Star Rating */}
          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
              Rate This Output
            </label>
            
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      size={24}
                      className={`transition-colors ${
                        star <= displayRating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
              
              <span className={`text-xs ${
                displayRating >= 4 ? 'text-emerald-400' :
                displayRating >= 3 ? 'text-amber-400' :
                displayRating >= 1 ? 'text-red-400' :
                'text-slate-500'
              }`}>
                {getRatingLabel(displayRating)}
              </span>
            </div>
          </div>

          {/* Feedback Input (shows when rating < 5) */}
          {rating > 0 && rating < 5 && (
            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <MessageSquare size={10} />
                What should be improved?
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Be specific: 'Make the opening hook stronger' or 'Add more data points about cap rates'"
                className="w-full h-20 bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          )}

          {/* Refine Button */}
          {rating > 0 && rating < 5 && (
            <button
              onClick={handleRefine}
              disabled={isRefining}
              className={`w-full h-10 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                isRefining
                  ? 'bg-amber-500/10 border border-amber-500 text-amber-400 animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {isRefining ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Refining...
                </>
              ) : (
                <>
                  <RefreshCw size={14} />
                  Refine Output
                </>
              )}
            </button>
          )}

          {/* Final confirmation when 5 stars */}
          {rating === 5 && (
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
              <Award size={24} className="mx-auto text-emerald-400 mb-2" />
              <p className="text-sm font-bold text-emerald-400">Perfect! Output is final.</p>
              <p className="text-xs text-slate-400 mt-1">Click Copy to use this content.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OutputRating;

