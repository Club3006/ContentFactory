
import React, { useState } from 'react';
import { fetchAndProcessEpisode, updateEpisodeMetadata } from '../../api/episodes';
import { Mic, Save, X, Loader2, RefreshCw } from 'lucide-react';
import { generatePodcastTitle } from '../../services/geminiService';

interface Props {
    onClose: () => void;
    onSaved?: () => void;
    style?: React.CSSProperties;
}

export const PodcastProducer: React.FC<Props> = ({ onClose, onSaved }) => {
    const [url, setUrl] = useState('');
    const [episodeNum, setEpisodeNum] = useState('');
    const [guest, setGuest] = useState('');
    const [title, setTitle] = useState('');
    const [transcriptPreview, setTranscriptPreview] = useState('');
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFetch = async () => {
        if (!url || !episodeNum) {
            setError("URL and Episode Number are required.");
            return;
        }
        setError(null);
        setIsLoading(true);
        setTranscriptPreview("Connecting to Apify and fetching transcript... this may take 10-20 seconds...");

        try {
            const result = await fetchAndProcessEpisode({
                transcriptUrl: url,
                episodeNumber: episodeNum,
                guest: guest
            });

            setTitle(result.title);
            setTranscriptPreview(result.transcriptText);
            setCurrentId(result.id!);
            setIsLoading(false);
        } catch (err) {
            setError((err as Error).message);
            setIsLoading(false);
            setTranscriptPreview("Error fetching transcript.");
        }
    };

    const handleRegenerateTitle = async () => {
        if (!transcriptPreview) return;
        setIsLoading(true);
        try {
            const newTitle = await generatePodcastTitle(transcriptPreview, guest, episodeNum);
            setTitle(newTitle);
            setIsLoading(false);
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
                transcriptText: transcriptPreview
            });
            if (onSaved) onSaved();
            onClose(); // Self-close after save
        } catch (err) {
            setError("Failed to save updates.");
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 font-mono text-slate-200">
            {/* Header */}
            <div className="h-12 border-b border-white/5 flex items-center justify-between px-6 bg-slate-950/30 shrink-0">
                <div className="flex items-center gap-2 text-emerald-400">
                    <Mic size={16} />
                    <span className="text-sm font-bold tracking-widest uppercase">Podcast Production</span>
                </div>
            </div>

            {/* Form Body */}
            <div className="flex-grow p-6 overflow-y-auto space-y-5">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded text-xs">
                        ERROR: {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-slate-500 font-bold">Episode # <span className="text-rose-400">*</span></label>
                        <input
                            type="text"
                            value={episodeNum}
                            onChange={e => setEpisodeNum(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm focus:border-emerald-500/50 outline-none text-white placeholder-slate-600"
                            placeholder="001"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-slate-500 font-bold">Guest ID</label>
                        <input
                            type="text"
                            value={guest}
                            onChange={e => setGuest(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm focus:border-emerald-500/50 outline-none text-white placeholder-slate-600"
                            placeholder="Name (Optional)"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-500 font-bold">Target Transcript URL <span className="text-rose-400">*</span></label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm focus:border-emerald-500/50 outline-none text-white placeholder-slate-600 font-mono"
                            placeholder="https://..."
                        />
                        <button
                            onClick={handleFetch}
                            disabled={isLoading}
                            className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/50 px-4 rounded text-xs font-bold transition-all whitespace-nowrap min-w-[100px] flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 size={14} className="animate-spin" /> : 'FETCH'}
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1">Accepts blog posts, HTML transcripts, and public text pages.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                    {/* Title Generation Section */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase text-emerald-500 font-bold flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                Generated Title
                                {isLoading && <span className="text-slate-500 font-normal animate-pulse">Generating...</span>}
                            </div>
                            {title && !isLoading && (
                                <button
                                    onClick={handleRegenerateTitle}
                                    className="text-[10px] text-emerald-400 hover:text-white flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 transition-colors"
                                >
                                    <RefreshCw size={10} />
                                    TRY AGAIN
                                </button>
                            )}
                        </label>
                        <textarea
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full h-32 bg-emerald-900/10 border border-emerald-500/20 rounded p-3 text-lg font-bold text-white focus:border-emerald-500/50 outline-none resize-none leading-relaxed"
                            placeholder="Title will appear here after fetch..."
                        />
                    </div>

                    {/* Transcript Preview Section */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase text-slate-500 font-bold flex justify-between">
                            <span>Transcript / Content</span>
                            <span className="text-slate-600 text-[9px] lowercase italic">editable</span>
                        </label>
                        <textarea
                            value={transcriptPreview}
                            onChange={e => setTranscriptPreview(e.target.value)}
                            className="w-full h-32 bg-black/40 border border-white/5 rounded p-3 text-xs text-slate-400 font-mono resize-none focus:outline-none focus:border-emerald-500/30"
                            placeholder="Transcript data..."
                        />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="h-14 border-t border-white/5 bg-slate-950/50 flex items-center justify-end px-6 gap-3 shrink-0">
                <button onClick={onClose} className="text-xs text-slate-500 hover:text-white px-4 py-2 transition-colors">CANCEL</button>
                <button
                    onClick={handleSave}
                    disabled={!currentId}
                    className={`px-6 py-2 rounded text-xs font-bold transition-all flex items-center gap-2 ${!currentId ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-500 text-black hover:bg-emerald-400'}`}
                >
                    <Save size={14} />
                    SAVE TO VAULT
                </button>
            </div>
        </div>
    );
};
