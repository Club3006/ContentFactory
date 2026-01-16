/**
 * KanbanCard Component
 * 
 * Visual card representation for ideas in the Vault/Library
 * Shows: Title, File Types, Date, IDEA label
 */

import React from 'react';
import { ContentIdea } from '../types';

interface KanbanCardProps {
  idea: ContentIdea;
  onClick?: () => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ idea, onClick }) => {
  // Generate 5-word title from content or transcript
  const generateTitle = (text: string): string => {
    const words = text.trim().split(/\s+/).slice(0, 5);
    return words.join(' ') + (text.split(/\s+/).length > 5 ? '...' : '');
  };

  const title = generateTitle(idea.content || idea.transcript || 'Untitled Idea');
  const dateStr = new Date(idea.createdAt || idea.timestamp).toLocaleDateString('en-US', { 
    month: 'numeric',
    day: 'numeric',
    year: '2-digit'
  });

  return (
    <div
      onClick={onClick}
      className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 hover:border-blue-500/50 hover:bg-slate-900/70 transition-all cursor-pointer group relative overflow-hidden"
    >
      {/* IDEA Label (Top Right) */}
      <div className="absolute top-3 right-3 bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
        IDEA
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-slate-200 mb-3 pr-12 leading-snug">
        {title}
      </h3>

      {/* Mini TallyTable (File Types) */}
      {idea.fileTypes && idea.fileTypes.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {idea.fileTypes.map((type, idx) => (
            <span
              key={idx}
              className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider"
            >
              {type}
            </span>
          ))}
        </div>
      )}

      {/* Date - 90% white */}
      <div className="pt-2 border-t border-slate-800">
        <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
          Saved {dateStr}
        </span>
      </div>
    </div>
  );
};

export default KanbanCard;
