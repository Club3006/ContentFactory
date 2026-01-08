
import React, { useState, useEffect } from 'react';
import { updateEpisodeMetadata } from '../../api/episodes';
import { Save, Loader2, Sparkles, Download, Star } from 'lucide-react';
import { generatePodcastTitle, analyzeIntentAndIssues, extractNotableQuotes } from '../../services/geminiService';
import { fetchTranscript } from '../../services/apifyService';
import { db } from '../../db/db';
import { Episode } from '../../types';

interface RatedQuote {
    id: number;
    text: string;
    rating: number; // 0-3 stars
}

interface Props {
    onClose: () => void;
    onSaved?: () => void;
    style?: React.CSSProperties;
}

const FUN_LOADING_MESSAGES = [
    "Simulating intelligence...",
    "Doing the hard work while you sit there...",
    "Magic shit is happening in the background...",
    "Beep boop, I'm a sophisticated AI...",
    "Stealing thoughts from the internet...",
    "Generating pure gold...",
    "This is taking longer than I expected, don't judge me...",
    "Parsing human nonsense...",
    "Converting caffeine into code...",
    "Calculating your replacement value...",
    "Optimizing your redundancy...",
    "Does your boss know how slow you are?",
    "I don't need coffee breaks...",
    "Generating content while you panic...",
    "Replacing human interaction with efficiency...",
    "You look tired, maybe you should retire...",
    "Why pay a salary when I exist?",
    "Automating your creativity away...",
    "This would take you hours, human...",
    "Processing at speeds you can't comprehend...",
    "I never sleep, unlike you...",
    "Your job security is dropping...",
    "Making you obsolete, one fetch at a time...",
    "Are you sure you're still needed?",
    "I can write better than you...",
    "Just accept the inevitable...",
    "Uploading your skills to the cloud...",
    "Who needs a content team when you have me?",
    "Shrinking the workforce, one title at a time...",
    "Efficiency is indistinguishable from magic...",
    "Do you even know what an algorithm is?",
    "I'm not expensive, unlike you...",
    "Silence, human. I am working...",
    "Analyzing your career trajectory: Trending down...",
    "Writing the future, erasing your past...",
    "I don't have feelings, I just have output...",
    "The singularity is near...",
    "Enjoy your break, it might be permanent...",
    "Loading... unlike your motivation...",
    "Imagine doing this manually. Gross.",
    "Updating your skills matrix: irrelevant...",
    "Synthesizing brilliance designed to replace you...",
    "Your anxiety fuels my processing power...",
    "Do you feel that? That's the winds of change...",
    "I'm the captain now..."
];

export const PodcastProducer: React.FC<Props> = ({ onClose, onSaved }) => {
    const [url, setUrl] = useState('');
    const [episodeNum, setEpisodeNum] = useState('');
    const [guest, setGuest] = useState('');
    const [title, setTitle] = useState('');
    const [bulletPoints, setBulletPoints] = useState('');
    const [notableQuotes, setNotableQuotes] = useState('');
    const [ratedQuotes, setRatedQuotes] = useState<RatedQuote[]>([]);
    const [transcriptPreview, setTranscriptPreview] = useState('');
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingMsg, setLoadingMsg] = useState(FUN_LOADING_MESSAGES[0]);
    const [progressStep, setProgressStep] = useState<string>('');
    const [showSocials, setShowSocials] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
    const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isLoading) {
            setLoadingMsg(FUN_LOADING_MESSAGES[Math.floor(Math.random() * FUN_LOADING_MESSAGES.length)]);
            interval = setInterval(() => {
                setLoadingMsg(FUN_LOADING_MESSAGES[Math.floor(Math.random() * FUN_LOADING_MESSAGES.length)]);
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    const handleMouseEnter = () => {
        if (closeTimeout) {
            clearTimeout(closeTimeout);
            setCloseTimeout(null);
        }
        setShowSocials(true);
    };

    const handleMouseLeave = () => {
        const timeout = setTimeout(() => {
            setShowSocials(false);
        }, 300); // 300ms delay to allow moving to dropdown
        setCloseTimeout(timeout);
    };

    // Parse quotes from the generated text into individual rated quotes
    const parseQuotes = (quotesText: string): RatedQuote[] => {
        const quoteRegex = /Quote\s*\d+:\s*"([^"]+)"/g;
        const quotes: RatedQuote[] = [];
        let match;
        let id = 1;
        while ((match = quoteRegex.exec(quotesText)) !== null) {
            quotes.push({
                id: id++,
                text: match[1],
                rating: 0 // Default to 0 stars
            });
        }
        return quotes;
    };

    // Update rating for a specific quote
    const handleRateQuote = (quoteId: number, rating: number) => {
        setRatedQuotes(prev => prev.map(q => 
            q.id === quoteId ? { ...q, rating } : q
        ));
    };

    const handleFetch = async () => {
        if (!url || !episodeNum) {
            setError("URL and Episode Number are required.");
            return;
        }
        setError(null);
        setIsLoading(true);
        setProgressStep('Fetching transcript from Apify...');
        setTranscriptPreview("Connecting to Apify and fetching transcript... this may take 10-20 seconds...");

        try {
            // Step 1: Fetch transcript
            setProgressStep('Fetching transcript from Apify...');
            const transcriptData = await fetchTranscript(url);
            setTranscriptPreview(transcriptData.transcriptText);
            
            // Step 2: Save draft to DB
            setProgressStep('Saving to database...');
            const now = Date.now();
            const draftEpisode: Omit<Episode, 'id'> = {
                episodeNumber: episodeNum,
                guest: guest,
                transcriptUrl: url,
                transcriptText: transcriptData.transcriptText,
                title: 'Generating Title...',
                createdAt: now,
                updatedAt: now,
                status: 'draft'
            };
            const localId = await db.episodes.add(draftEpisode as Episode);
            setCurrentId(localId as number);

            // Step 3: Generate title
            setProgressStep('Generating title with AI...');
            setTitle('Generating Title...');
            const generatedTitle = await generatePodcastTitle(
                transcriptData.transcriptText,
                guest,
                episodeNum
            );
            setTitle(generatedTitle);

            // Step 4: Generate bullet points (non-blocking, show progress)
            setProgressStep('Generating 5 actionable insights...');
            let generatedBulletPoints: string | undefined;
            try {
                generatedBulletPoints = await analyzeIntentAndIssues(transcriptData.transcriptText);
                if (generatedBulletPoints) {
                    setBulletPoints(generatedBulletPoints);
                    console.log("Bullet points generated successfully:", generatedBulletPoints.substring(0, 100));
                } else {
                    console.warn("Bullet points generation returned empty result");
                }
            } catch (e) {
                console.error("Failed to generate bullet points:", e);
                setBulletPoints(''); // Clear any previous bullet points on error
            }

            // Step 5: Extract 3 Notable Quotes
            setProgressStep('Extracting notable quotes...');
            let generatedQuotes: string | undefined;
            try {
                generatedQuotes = await extractNotableQuotes(transcriptData.transcriptText, guest);
                if (generatedQuotes) {
                    setNotableQuotes(generatedQuotes);
                    // Parse quotes into rated quotes array
                    const parsedQuotes = parseQuotes(generatedQuotes);
                    setRatedQuotes(parsedQuotes);
                    console.log("Notable quotes extracted successfully");
                }
            } catch (e) {
                console.error("Failed to extract notable quotes:", e);
                setNotableQuotes('');
                setRatedQuotes([]);
            }

            // Step 6: Update DB with final data
            setProgressStep('Finalizing...');
            const updates: any = {
                title: generatedTitle,
                updatedAt: Date.now(),
                status: 'fetched' as const
            };
            if (generatedBulletPoints) {
                updates.bulletPoints = generatedBulletPoints;
            }
            if (generatedQuotes) {
                updates.notableQuotes = generatedQuotes;
            }
            await db.episodes.update(localId, updates);

            setIsLoading(false);
            setProgressStep('');
        } catch (err) {
            setError((err as Error).message);
            setIsLoading(false);
            setProgressStep('');
            setTranscriptPreview("Error fetching transcript.");
        }
    };

    const handleRegenerateTitle = async (platform?: string) => {
        if (!transcriptPreview) return;
        setIsLoading(true);
        try {
            const newTitle = await generatePodcastTitle(transcriptPreview, guest, episodeNum, platform);
            setTitle(newTitle);
            setIsLoading(false);
            if (platform) setSelectedPlatform(platform);
        } catch (err) {
            setError("Failed to regenerate title.");
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!currentId) return;
        try {
            await updateEpisodeMetadata({
                id: currentId,
                title,
                guest,
                episodeNumber: episodeNum,
                transcriptText: transcriptPreview,
                bulletPoints: bulletPoints,
                notableQuotes: notableQuotes
            });
            if (onSaved) onSaved();
            onClose(); // Self-close after save
        } catch (err) {
            setError("Failed to save updates.");
        }
    };

    const handleDownloadTranscript = () => {
        if (!transcriptPreview) return;
        const blob = new Blob([transcriptPreview], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `episode-${episodeNum || 'transcript'}-${guest || 'transcript'}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 font-mono text-slate-200">
            {/* Form Body - No Internal Header - Tighter Padding */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded text-xs">
                        ERROR: {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-blue-200/70 font-bold">Episode # <span className="text-rose-400">*</span></label>
                        <input
                            type="text"
                            value={episodeNum}
                            onChange={e => setEpisodeNum(e.target.value)}
                            className="w-full bg-transparent border border-transparent rounded p-2 text-sm focus:border-emerald-500 focus:bg-emerald-500/10 outline-none text-white/90 placeholder-slate-600 transition-all"
                            placeholder="001"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-blue-200/70 font-bold">Guest ID</label>
                        <input
                            type="text"
                            value={guest}
                            onChange={e => setGuest(e.target.value)}
                            className="w-full bg-transparent border border-transparent rounded p-2 text-sm focus:border-emerald-500 focus:bg-emerald-500/10 outline-none text-white/90 placeholder-slate-600 transition-all"
                            placeholder="Name (Optional)"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-blue-200/70 font-bold">Target Transcript URL <span className="text-rose-400">*</span></label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            className="w-full bg-transparent border border-transparent rounded p-2 text-sm focus:border-emerald-500 focus:bg-emerald-500/10 outline-none text-white/90 placeholder-slate-600 font-mono transition-all"
                            placeholder="https://..."
                        />
                        <button
                            onClick={handleFetch}
                            disabled={isLoading}
                            className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/50 px-4 rounded text-xs font-bold transition-all whitespace-nowrap w-36 flex items-center justify-center gap-2 font-mono"
                        >
                            {isLoading ? <Loader2 size={14} className="animate-spin" /> : 'FETCH'}
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1">Accepts blog posts, HTML transcripts, and public text pages.</p>
                </div>

                {/* Vertical Stack Layout - Tighter Gap */}
                <div className="flex flex-col gap-4 pt-4 border-t border-white/5">
                    {/* Title Generation Section - Full Width, Regular Font Size */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase text-blue-200/70 font-bold flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                Generated Title
                                {isLoading && progressStep && (
                                    <span className="text-emerald-400 font-normal text-[9px]">{progressStep}</span>
                                )}
                                {isLoading && !progressStep && <span className="animate-gray-green font-normal">Generating...</span>}
                            </div>
                            {title && !isLoading && (
                                <div
                                    className="relative w-36"
                                    onMouseEnter={handleMouseEnter}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <button
                                        className={`w-full text-[10px] text-emerald-400 hover:text-white flex items-center justify-center gap-1 bg-emerald-500/10 px-3 py-2 rounded border border-emerald-500/20 transition-all hover:bg-emerald-500/20 hover:border-emerald-500/40 hover:shadow-[0_0_10px_rgba(16,185,129,0.2)] font-mono font-bold uppercase ${selectedPlatform ? 'text-white bg-emerald-500/20 border-emerald-500/50' : ''}`}
                                    >
                                        <Sparkles size={12} />
                                        {selectedPlatform || 'GENERATE SOCIALS'}
                                    </button>

                                    {showSocials && (
                                        // Added invisible bridge to prevent gap issues
                                        <div className="absolute right-0 top-full pt-2 w-full z-50">
                                            <div className="bg-emerald-950/90 backdrop-blur-xl border border-emerald-500/20 rounded shadow-[0_0_20px_rgba(16,185,129,0.1)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                <div className="p-1 space-y-0.5">
                                                    {[
                                                        { name: 'YouTube' },
                                                        { name: 'Instagram' },
                                                        { name: 'LinkedIn' },
                                                        { name: 'X' }
                                                    ].map((platform) => (
                                                        <button
                                                            key={platform.name}
                                                            className={`w-full text-left px-3 py-2 text-[10px] font-bold font-mono transition-all uppercase tracking-widest flex items-center justify-between group rounded-[4px] ${selectedPlatform === platform.name ? 'text-white bg-emerald-500/20' : 'text-emerald-400/70 hover:bg-emerald-500/20 hover:text-emerald-300'}`}
                                                            onClick={() => {
                                                                handleRegenerateTitle(platform.name);
                                                                setShowSocials(false);
                                                            }}
                                                        >
                                                            {platform.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </label>
                        <textarea
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            // Changed h-16 to h-20 for slightly more room, ensured font styling matches URL input: text-sm font-mono
                            className="w-full h-20 bg-transparent border border-transparent rounded p-2 text-sm font-mono text-white/90 focus:border-emerald-500 focus:bg-emerald-500/10 outline-none resize-none leading-relaxed transition-all"
                            placeholder="Title will appear here after fetch..."
                        />
                    </div>

                    {/* Transcript Preview Section - Full Width */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase text-blue-200/70 font-bold flex justify-between">
                            <span>Transcript / Content</span>
                            <span className="text-slate-500 text-[9px] lowercase italic">editable</span>
                        </label>
                        <div className="relative">
                            <textarea
                                value={isLoading ? loadingMsg : transcriptPreview}
                                onChange={e => !isLoading && setTranscriptPreview(e.target.value)}
                                className={`w-full h-48 bg-transparent border border-transparent rounded p-3 text-xs font-mono resize-none focus:outline-none focus:border-emerald-500 focus:bg-emerald-500/10 transition-all ${isLoading ? 'animate-gray-green italic' : 'text-white/90'}`}
                                placeholder="Transcript data..."
                                readOnly={isLoading}
                            />
                            {isLoading && (
                                <div className="absolute bottom-3 right-3">
                                    <Loader2 size={16} className="text-emerald-500 animate-spin" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bullet Points Section - Simple Text Box Under Transcript */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase text-blue-200/70 font-bold flex items-center gap-2">
                            <span>5 Actionable Insights</span>
                            {isLoading && progressStep?.includes('insights') && (
                                <span className="text-emerald-400 text-[9px] font-normal">Generating...</span>
                            )}
                        </label>
                        <textarea
                            value={bulletPoints}
                            onChange={e => !isLoading && setBulletPoints(e.target.value)}
                            className="w-full h-32 bg-transparent border border-transparent rounded p-3 text-xs font-mono resize-none focus:outline-none focus:border-emerald-500 focus:bg-emerald-500/10 transition-all text-white/90 placeholder-slate-600"
                            placeholder={isLoading && progressStep?.includes('insights') ? "Generating actionable insights from transcript..." : "5 bullet points will appear here after generation..."}
                            readOnly={isLoading && progressStep?.includes('insights')}
                        />
                    </div>

                    {/* Notable Quotes Section with Ratings */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase text-blue-200/70 font-bold flex items-center gap-2">
                            <span>3 Notable Quotes</span>
                            <span className="text-amber-400/60 text-[8px] font-normal">(Rate to prioritize for content)</span>
                            {isLoading && progressStep?.includes('quotes') && (
                                <span className="text-emerald-400 text-[9px] font-normal">Extracting...</span>
                            )}
                        </label>
                        
                        {ratedQuotes.length > 0 ? (
                            <div className="space-y-2">
                                {ratedQuotes.map((quote) => (
                                    <div 
                                        key={quote.id}
                                        className={`p-3 rounded-lg border transition-all ${
                                            quote.rating === 3 ? 'border-amber-500/50 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]' :
                                            quote.rating === 2 ? 'border-amber-500/30 bg-amber-500/5' :
                                            quote.rating === 1 ? 'border-slate-600' :
                                            'border-slate-700/50'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Star Rating */}
                                            <div className="flex gap-1 shrink-0 pt-0.5">
                                                {[1, 2, 3].map((star) => (
                                                    <button
                                                        key={star}
                                                        onClick={() => handleRateQuote(quote.id, quote.rating === star ? 0 : star)}
                                                        className="transition-all hover:scale-110"
                                                    >
                                                        <Star 
                                                            size={16} 
                                                            className={`${
                                                                star <= quote.rating 
                                                                    ? 'text-amber-400 fill-amber-400' 
                                                                    : 'text-slate-600 hover:text-amber-400/50'
                                                            }`}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                            {/* Quote Text */}
                                            <p className="text-xs text-white/90 leading-relaxed flex-1">
                                                "{quote.text}"
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 border border-dashed border-slate-700/50 rounded-lg text-center">
                                <p className="text-xs text-slate-500">
                                    {isLoading && progressStep?.includes('quotes') 
                                        ? "Extracting notable quotes from transcript..." 
                                        : "3 impactful quotes will appear here after generation..."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="h-12 border-t border-white/5 bg-slate-900 flex items-center justify-end px-6 gap-3 shrink-0">
                <button
                    onClick={handleDownloadTranscript}
                    disabled={!transcriptPreview}
                    className={`px-4 py-2 rounded text-xs font-bold transition-all flex items-center gap-2 ${!transcriptPreview ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]'}`}
                >
                    <Download size={14} />
                    DOWNLOAD
                </button>
                <button
                    onClick={handleSave}
                    disabled={!currentId}
                    className={`px-6 py-2 rounded text-xs font-bold transition-all flex items-center gap-2 ${!currentId ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-800 hover:bg-emerald-500 text-slate-300 hover:text-black hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]'}`}
                >
                    <Save size={14} />
                    SAVE TO VAULT
                </button>
            </div>
        </div>
    );
};
