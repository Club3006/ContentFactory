
import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Episode } from '../../db/db';
import { Podcast } from 'lucide-react';

interface Props {
    onSelectEpisode?: (episode: Episode) => void;
}

export const PodcastLibrary: React.FC<Props> = ({ onSelectEpisode }) => {
    // Live Query for Episodes List
    const episodes = useLiveQuery(() => db.episodes.orderBy('createdAt').reverse().toArray());

    const columns = [
        { id: 'draft', label: 'Draft / Fetched', statusMatch: (s: string) => ['draft', 'fetched'].includes(s) },
        { id: 'production', label: 'In Production', statusMatch: (s: string) => ['scripting', 'production'].includes(s) },
        { id: 'published', label: 'Published', statusMatch: (s: string) => s === 'published' }
    ];

    if (!episodes) return <div className="p-10 text-slate-500 font-mono text-xs">Loading Vault...</div>;

    return (
        <div className="h-full flex flex-col bg-slate-900 font-mono text-slate-200">
            <div className="h-12 border-b border-white/5 flex items-center px-6 bg-slate-950/30 shrink-0 gap-3">
                <Podcast size={16} className="text-emerald-500" />
                <span className="text-sm font-bold tracking-widest uppercase">Podcast Vault</span>
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-500">{episodes.length} Episodes</span>
            </div>

            <div className="flex-grow p-6 overflow-x-auto">
                <div className="flex gap-6 h-full min-w-[800px]">
                    {columns.map(col => (
                        <div key={col.id} className="flex-1 min-w-[300px] flex flex-col bg-slate-950/20 rounded-xl border border-white/5 h-full">
                            <div className="p-3 border-b border-white/5 uppercase text-[10px] font-bold text-slate-500 tracking-wider">
                                {col.label}
                            </div>
                            <div className="p-3 flex-grow overflow-y-auto space-y-3 custom-scrollbar">
                                {episodes.filter(ep => col.statusMatch(ep.status)).map(ep => (
                                    <div
                                        key={ep.id}
                                        onClick={() => onSelectEpisode?.(ep)}
                                        className="bg-slate-800/40 border border-white/5 p-4 rounded-lg hover:border-emerald-500/30 hover:bg-slate-800/60 transition-all cursor-pointer group shadow-sm active:scale-[0.99]"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[9px] font-black text-emerald-500/80 bg-emerald-500/10 px-1.5 py-0.5 rounded">EP {ep.episodeNumber}</span>
                                            <span className="text-[8px] text-slate-600">{new Date(ep.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <h4 className="text-xs font-bold text-white leading-relaxed mb-2 line-clamp-2 group-hover:text-emerald-300 transition-colors">
                                            {ep.title}
                                        </h4>
                                        {ep.guest && (
                                            <div className="text-[9px] text-slate-500 border-t border-white/5 pt-2 mt-2">
                                                Guest: <span className="text-slate-300">{ep.guest}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {episodes.filter(ep => col.statusMatch(ep.status)).length === 0 && (
                                    <div className="text-[9px] text-slate-700 text-center py-10 border border-white/5 border-dashed rounded">
                                        Empty
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
