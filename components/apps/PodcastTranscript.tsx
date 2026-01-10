/**
 * PodcastTranscript Component
 * 
 * Displays podcast transcript with:
 * - Selectable/copyable text
 * - Search functionality
 * - Quote extraction using CopyPro intelligence
 * - 1-3 star rating system for quotes (saved for learning)
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Search, Sparkles, Loader2, Star, Copy, CheckCircle } from 'lucide-react';
import { extractQuotesWithSpeakers } from '../../services/geminiService';
import { QuoteWithRating } from '../../types';
import { db } from '../../db/db';

interface Props {
  title: string;
  transcript: string;
  episodeId?: number;
  guest?: string;
  initialQuotes?: QuoteWithRating[];
}

// Generate unique ID
const generateId = () => `quote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Star Rating Component
const StarRating: React.FC<{
  rating: number | undefined;
  onRate: (rating: 1 | 2 | 3) => void;
}> = ({ rating, onRate }) => {
  const [hover, setHover] = useState(0);
  
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((star) => (
        <button
          key={star}
          onClick={() => onRate(star as 1 | 2 | 3)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            size={16}
            className={`transition-colors ${
              star <= (hover || rating || 0)
                ? 'text-amber-400 fill-amber-400'
                : 'text-slate-600'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

// Quote Card Component
const QuoteCard: React.FC<{
  quote: QuoteWithRating;
  index: number;
  onRate: (id: string, rating: 1 | 2 | 3) => void;
}> = ({ quote, index, onRate }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`"${quote.text}" — ${quote.speaker}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-amber-500/30 transition-all group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500/70">
          Quote {index + 1}
        </span>
        <div className="flex items-center gap-2">
          {quote.timestamp && (
            <span className="text-[9px] text-slate-500 font-mono">
              [{quote.timestamp}]
            </span>
          )}
          <StarRating
            rating={quote.rating}
            onRate={(r) => onRate(quote.id, r)}
          />
        </div>
      </div>
      
      <p className="text-sm text-slate-200 leading-relaxed mb-2 select-text cursor-text">
        "{quote.text}"
      </p>
      
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-bold">
          — {quote.speaker}
        </span>
        <button
          onClick={handleCopy}
          className={`text-[9px] px-2 py-1 rounded flex items-center gap-1 transition-all ${
            copied
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-slate-700 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100'
          }`}
        >
          {copied ? (
            <>
              <CheckCircle size={10} />
              Copied
            </>
          ) : (
            <>
              <Copy size={10} />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export const PodcastTranscript: React.FC<Props> = ({ 
  title, 
  transcript, 
  episodeId,
  guest,
  initialQuotes = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [quotes, setQuotes] = useState<QuoteWithRating[]>(initialQuotes);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showQuotes, setShowQuotes] = useState(initialQuotes.length > 0);

  // Extract quotes using CopyPro
  const handleExtractQuotes = useCallback(async () => {
    setIsExtracting(true);
    setShowQuotes(true);

    try {
      const extracted = await extractQuotesWithSpeakers(transcript, guest);
      
      const quotesWithRating: QuoteWithRating[] = extracted.map(q => ({
        id: generateId(),
        text: q.text,
        speaker: q.speaker,
        timestamp: q.timestamp,
        rating: undefined,
        ratedAt: undefined
      }));

      setQuotes(quotesWithRating);

      // Save to database if episodeId provided
      if (episodeId) {
        await db.episodes.update(episodeId, {
          ratedQuotes: quotesWithRating,
          updatedAt: Date.now()
        });
      }
    } catch (error) {
      console.error('Failed to extract quotes:', error);
    } finally {
      setIsExtracting(false);
    }
  }, [transcript, guest, episodeId]);

  // Rate a quote and save to database
  const handleRateQuote = useCallback(async (quoteId: string, rating: 1 | 2 | 3) => {
    const updatedQuotes = quotes.map(q =>
      q.id === quoteId
        ? { ...q, rating, ratedAt: Date.now() }
        : q
    );
    
    setQuotes(updatedQuotes);

    // Save to database
    if (episodeId) {
      try {
        await db.episodes.update(episodeId, {
          ratedQuotes: updatedQuotes,
          updatedAt: Date.now()
        });
      } catch (error) {
        console.error('Failed to save rating:', error);
      }
    }
  }, [quotes, episodeId]);

  // Highlighted transcript content
  const content = useMemo(() => {
    if (!searchQuery) {
      return (
        <span className="text-slate-300 leading-relaxed whitespace-pre-wrap">
          {transcript}
        </span>
      );
    }

    const parts = transcript.split(new RegExp(`(${searchQuery})`, 'gi'));
    return (
      <span className="text-slate-300 leading-relaxed whitespace-pre-wrap">
        {parts.map((part, i) =>
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <span key={i} className="bg-yellow-500/30 text-yellow-200 px-0.5 rounded font-bold">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  }, [transcript, searchQuery]);

  return (
    <div className="h-full flex flex-col bg-slate-900 font-mono text-slate-200">
      {/* Toolbar */}
      <div className="h-14 border-b border-white/5 flex items-center px-4 bg-slate-950/50 shrink-0 gap-3">
        {/* Search */}
        <div className="flex-grow relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcript..."
            className="w-full bg-transparent border border-transparent rounded-full py-1.5 pl-9 pr-4 text-xs text-white focus:border-emerald-500 focus:bg-emerald-500/10 outline-none transition-all"
          />
        </div>

        {/* Extract Quotes Button */}
        <button
          onClick={handleExtractQuotes}
          disabled={isExtracting}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
            isExtracting
              ? 'bg-amber-500/10 border border-amber-500 text-amber-400 animate-pulse'
              : 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50'
          }`}
        >
          {isExtracting ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Extracting...
            </>
          ) : (
            <>
              <Sparkles size={12} />
              Extract Best Quotes
            </>
          )}
        </button>

        {/* Title */}
        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider max-w-[150px] truncate hidden lg:block ml-auto">
          {title}
        </div>
      </div>

      {/* Quotes Panel */}
      {showQuotes && (
        <div className="border-b border-white/5 bg-slate-950/30 p-4 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500/70">
              Extracted Quotes
            </span>
            {quotes.length > 0 && (
              <span className="text-[9px] text-slate-600">
                Rate quotes to improve future extractions
              </span>
            )}
          </div>

          {isExtracting ? (
            <div className="flex items-center justify-center py-8 text-slate-500">
              <Loader2 size={20} className="animate-spin mr-2" />
              <span className="text-xs">Using CopyPro to find best quotes...</span>
            </div>
          ) : quotes.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-3">
              {quotes.map((quote, index) => (
                <QuoteCard
                  key={quote.id}
                  quote={quote}
                  index={index}
                  onRate={handleRateQuote}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-600 text-xs">
              Click "Extract Best Quotes" to analyze the transcript
            </div>
          )}
        </div>
      )}

      {/* Transcript Content - Selectable */}
      <div className="flex-grow overflow-y-auto p-8 bg-slate-900 custom-scrollbar">
        <div className="max-w-3xl mx-auto text-sm select-text cursor-text">
          {content}
        </div>
      </div>
    </div>
  );
};
