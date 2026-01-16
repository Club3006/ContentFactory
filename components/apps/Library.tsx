
import React, { useState, useEffect } from 'react';
import { ContentIdea } from '../../types';
import { dbService } from '../../services/dbService';
import { KanbanCard } from '../KanbanCard';

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-4 custom-scrollbar flex-grow">
        {ideas.length === 0 ? (
          <div className="col-span-full h-32 flex items-center justify-center border border-dashed border-slate-800 rounded-xl opacity-20">
            <span className="text-[8px] font-black uppercase tracking-widest">No Assets Captured</span>
          </div>
        ) : (
          ideas.map(idea => (
            <KanbanCard
              key={idea.id}
              idea={idea}
              onClick={() => onSelectIdea?.(idea)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Library;
