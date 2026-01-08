
import React from 'react';
import { Episode } from '../../types';
import { FileText, User, Hash, Calendar, ArrowRight, Sparkles, Quote } from 'lucide-react';

interface Props {
    episode: Episode;
    onViewTranscript: () => void;
}

export const PodcastDetail: React.FC<Props> = ({ episode, onViewTranscript }) => {
    return (
        <div className="h-full flex flex-col bg-slate-900 font-mono text-slate-200 overflow-y-auto">
            <div className="p-6 space-y-6">
                {/* Header Section */}
                <div className="space-y-4 border-b border-white/5 pb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                            Episode {episode.episodeNumber}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                            {episode.status}
                        </span>
                        <span className="text-[10px] text-slate-600 ml-auto font-bold">
                            {new Date(episode.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">
                        {episode.title}
                    </h1>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950/30 p-4 rounded-lg border border-white/5 space-y-1">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                            <User size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Guest</span>
                        </div>
                        <div className="text-sm font-semibold text-slate-300">
                            {episode.guest || "No Guest Listed"}
                        </div>
                    </div>
                    <div className="bg-slate-950/30 p-4 rounded-lg border border-white/5 space-y-1">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                            <Hash size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Source</span>
                        </div>
                        <div className="text-sm font-semibold text-slate-300 truncate underline decoration-slate-700 underline-offset-4">
                            {episode.transcriptUrl}
                        </div>
                    </div>
                </div>

                {/* Bullet Points Section */}
                {episode.bulletPoints && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-emerald-400">
                            <Sparkles size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">5 Actionable Insights</span>
                        </div>
                        <div className="bg-slate-950/30 border border-emerald-500/20 rounded-lg p-4 select-text cursor-text">
                            <div className="text-sm font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {episode.bulletPoints}
                            </div>
                        </div>
                    </div>
                )}

                {/* Notable Quotes Section */}
                {episode.notableQuotes && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-amber-400">
                            <Quote size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">3 Notable Quotes</span>
                        </div>
                        <div className="bg-slate-950/30 border border-amber-500/20 rounded-lg p-4 select-text cursor-text">
                            <div className="text-sm font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {episode.notableQuotes}
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="pt-4">
                    <button
                        onClick={onViewTranscript}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                    >
                        <FileText size={14} />
                        View Full Transcript
                        <ArrowRight size={14} />
                    </button>
                    <p className="text-center text-[10px] text-slate-600 mt-2">
                        Opens searchable transcript viewer in new window
                    </p>
                </div>
            </div>
        </div>
    );
};
