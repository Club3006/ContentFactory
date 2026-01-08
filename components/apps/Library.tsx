
import React, { useState, useEffect } from 'react';
import { ContentIdea } from '../../types';
import { dbService } from '../../services/dbService';

interface LibraryProps {
  onSelectIdea?: (idea: ContentIdea) => void;
}

const Library: React.FC<LibraryProps> = ({ onSelectIdea }) => {
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const fetched = await dbService.getAllIdeas();
        setIdeas(fetched);
      } catch (e) {
        console.error("Failed to load ideas from Firebase:", e);
      }
    };
    load();
  }, []);

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 shrink-0">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Vault Assets</h3>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-blue-400 px-2 py-0.5 bg-blue-500/10 rounded tracking-tighter">{ideas.length} ASSETS TOTAL</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto pb-4 custom-scrollbar flex-grow">
        {ideas.length === 0 ? (
          <div className="h-32 flex items-center justify-center border border-dashed border-slate-800 rounded-xl opacity-20">
            <span className="text-[8px] font-black uppercase tracking-widest">No Assets Captured</span>
          </div>
        ) : (
          ideas.map(idea => (
            <div
              key={idea.id}
              onClick={() => onSelectIdea?.(idea)}
              className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl hover:border-emerald-500/50 hover:bg-slate-950/80 transition-all cursor-pointer group shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`text-[7px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${idea.type === 'url' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {idea.type}
                </span>
                <span className={`text-[7px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${idea.status === 'digested' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-500'}`}>
                  {idea.status === 'digested' ? 'READY' : 'SAVED'}
                </span>
              </div>
              <p className={`text-[12px] font-semibold line-clamp-2 leading-relaxed italic mb-3 ${idea.status === 'digested' ? 'text-slate-300' : 'text-amber-100/80'}`}>
                "{idea.content}"
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
                <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">Captured {new Date(idea.timestamp).toLocaleDateString()}</span>
                {idea.status === 'digested' ? (
                  <div className="text-[8px] font-black text-blue-500 group-hover:translate-x-1 transition-transform">VIEW ASSET →</div>
                ) : (
                  <div className="text-[8px] font-black text-amber-500 group-hover:translate-x-1 transition-transform">PENDING INGESTION →</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Library;
