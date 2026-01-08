
import React, { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
    title: string;
    transcript: string;
}

export const PodcastTranscript: React.FC<Props> = ({ title, transcript }) => {
    const [searchQuery, setSearchQuery] = useState('');

    // Simple highlighting logic
    const content = useMemo(() => {
        if (!searchQuery) return <span className="text-slate-300 leading-relaxed whitespace-pre-wrap">{transcript}</span>;

        const parts = transcript.split(new RegExp(`(${searchQuery})`, 'gi'));
        return (
            <span className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {parts.map((part, i) =>
                    part.toLowerCase() === searchQuery.toLowerCase() ? (
                        <span key={i} className="bg-yellow-500/30 text-yellow-200 px-0.5 rounded font-bold">{part}</span>
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
            <div className="h-14 border-b border-white/5 flex items-center px-4 bg-slate-950/50 shrink-0 gap-4">
                <div className="flex-grow relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search transcript..."
                        className="w-full bg-transparent border border-transparent rounded-full py-1.5 pl-9 pr-4 text-xs text-white focus:border-emerald-500 focus:bg-emerald-500/30 outline-none transition-all"
                    />
                </div>
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider max-w-[200px] truncate hidden md:block">
                    {title}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-grow overflow-y-auto p-8 bg-slate-900 custom-scrollbar">
                <div className="max-w-3xl mx-auto text-sm">
                    {content}
                </div>
            </div>
        </div>
    );
};
