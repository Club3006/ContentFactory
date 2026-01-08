
import React from 'react';
import { ContentIdea } from '../../types';

interface IdeaDetailProps {
  idea: ContentIdea;
}

const IdeaDetail: React.FC<IdeaDetailProps> = ({ idea }) => {
  const handleClipToLab = () => {
    // We could use an event or a context to trigger the Lab to open with this ID
    // For now, let's assume the user can see this asset in the Lab dropdown
    // But we'll add a visual confirmation
    alert(`Asset "${idea.content.substring(0, 20)}..." has been prioritized for the Production Lab.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Source Digested</h2>
          <p className="text-sm font-bold text-slate-200 truncate max-w-[400px]">{idea.content}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Analyzed On</p>
          <p className="text-[10px] font-bold text-slate-400">{new Date(idea.timestamp).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-black/50 border border-slate-800 rounded-2xl p-5 shadow-inner">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Automated Intelligence Output</h3>
          </div>
          <div className="text-sm text-slate-300 leading-relaxed max-h-[350px] overflow-y-auto custom-scrollbar pr-2 whitespace-pre-wrap font-mono">
            {idea.transcript || idea.content || "No transcript available for this asset type."}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClipToLab}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95"
          >
            CLIP TO LAB
          </button>
          <button className="flex-1 border border-slate-800 hover:bg-slate-800 text-slate-400 font-bold py-4 rounded-xl text-[10px] uppercase tracking-widest transition-all">
            RE-SCRAPE
          </button>
        </div>
      </div>
    </div>
  );
};

export default IdeaDetail;
