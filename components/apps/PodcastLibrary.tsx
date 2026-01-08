
import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Episode } from '../../types';
import { Podcast } from 'lucide-react';

interface Props {
    onSelectEpisode?: (episode: Episode) => void;
}

export const PodcastLibrary: React.FC<Props> = ({ onSelectEpisode }) => {
    // Live Query for Episodes List
    const episodes = useLiveQuery(() => db.episodes.orderBy('createdAt').reverse().toArray());

    if (!episodes) return <div className="p-10 text-slate-500 font-mono text-xs">Loading Vault...</div>;

    return (
        <div className="h-full flex flex-col bg-slate-900 font-mono text-slate-200">
            <div className="h-12 border-b border-white/5 flex items-center px-6 bg-slate-950/30 shrink-0 gap-3">
                <Podcast size={16} className="text-emerald-500" />
                <span className="text-sm font-bold tracking-widest uppercase">Podcast Vault</span>
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-500">{episodes.length} Episodes</span>
            </div>

            <div className="flex-grow p-6 overflow-y-auto">
                {/* Full-width container */}
                <div className="w-full bg-slate-950/20 rounded-xl border border-white/5 h-full flex flex-col">
                    <div className="p-3 border-b border-white/5 uppercase text-[10px] font-bold text-slate-500 tracking-wider">
                        Draft / Fetched
                    </div>
                    <div className="p-4 flex-grow overflow-y-auto custom-scrollbar">
                        {episodes.length > 0 ? (
                            <div className="grid grid-cols-3 gap-4">
                                {episodes.map(ep => (
                                    <div
                                        key={ep.id}
                                        draggable={true}
                                        onDragStart={(e) => {
                                            e.dataTransfer.effectAllowed = 'copy';
                                            e.dataTransfer.setData('application/json', JSON.stringify({
                                                type: 'podcast-episode',
                                                transcript: ep.transcriptText,
                                                title: ep.title,
                                                episodeNumber: ep.episodeNumber,
                                                guest: ep.guest
                                            }));
                                            if (e.currentTarget instanceof HTMLElement) {
                                                e.currentTarget.style.opacity = '0.5';
                                            }
                                        }}
                                        onDragEnd={(e) => {
                                            if (e.currentTarget instanceof HTMLElement) {
                                                e.currentTarget.style.opacity = '1';
                                            }
                                        }}
                                        onClick={() => onSelectEpisode?.(ep)}
                                        className="bg-slate-900 border border-white/5 p-4 rounded-lg hover:border-emerald-500/30 hover:bg-slate-900/80 transition-all cursor-pointer group shadow-sm active:scale-[0.99]"
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
                            </div>
                        ) : (
                            <div className="text-[9px] text-slate-700 text-center py-10 border border-white/5 border-dashed rounded">
                                No episodes yet. Use the Podcast Producer to add episodes.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
