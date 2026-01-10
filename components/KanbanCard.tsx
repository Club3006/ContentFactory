import React, { useState, useRef, useEffect } from 'react';
import { VaultItem, VaultItemType } from '../types';
import { Trash2 } from 'lucide-react';

interface Props {
  item: VaultItem;
  onOpen: (item: VaultItem) => void;
  onDelete: (item: VaultItem) => void;
}

const TYPE_COLORS: Record<VaultItemType, { border: string; bg: string; badge: string }> = {
  idea: {
    border: 'border-blue-500/50',
    bg: 'bg-blue-500/10',
    badge: 'bg-blue-500/20 text-blue-400'
  },
  podcast: {
    border: 'border-emerald-500/50',
    bg: 'bg-emerald-500/10',
    badge: 'bg-emerald-500/20 text-emerald-400'
  },
  generator: {
    border: 'border-purple-500/50',
    bg: 'bg-purple-500/10',
    badge: 'bg-purple-500/20 text-purple-400'
  },
  linkedin: {
    border: 'border-[#0077B5]/50',
    bg: 'bg-[#0077B5]/10',
    badge: 'bg-[#0077B5]/20 text-[#0077B5]'
  }
};

const TYPE_LABELS: Record<VaultItemType, string> = {
  idea: 'Idea',
  podcast: 'Podcast',
  generator: 'Generator',
  linkedin: 'LinkedIn'
};

export const KanbanCard: React.FC<Props> = ({ item, onOpen, onDelete }) => {
  const [showDelete, setShowDelete] = useState(false);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const colors = TYPE_COLORS[item.type];

  const handlePointerDown = () => {
    isLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setShowDelete(true);
    }, 600);
  };

  const handlePointerUp = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handlePointerLeave = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleClick = () => {
    // Only open if it wasn't a long press and delete isn't showing
    if (!isLongPress.current && !showDelete) {
      onOpen(item);
    }
    // Reset long press flag after click
    isLongPress.current = false;
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(item);
    setShowDelete(false);
  };

  // Hide delete after timeout
  useEffect(() => {
    if (showDelete) {
      const timer = setTimeout(() => setShowDelete(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showDelete]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      className={`relative p-4 rounded-lg border ${colors.border} ${colors.bg} hover:shadow-lg transition-all cursor-pointer group active:scale-[0.98] select-none`}
    >
      {/* Delete button overlay */}
      {showDelete && (
        <div 
          className="absolute inset-0 bg-red-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center z-10 animate-in fade-in duration-200"
          onClick={handleDeleteClick}
        >
          <button className="p-3 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors shadow-lg">
            <Trash2 size={20} />
          </button>
        </div>
      )}

      {/* Header with type badge and date */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${colors.badge}`}>
          {TYPE_LABELS[item.type]}
          {item.contentType && <span className="opacity-70"> • {item.contentType}</span>}
        </span>
        <span className="text-[9px] text-slate-400">
          {formatDate(item.updatedAt)}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-xs font-bold text-white leading-relaxed line-clamp-2 group-hover:text-white/90 transition-colors">
        {item.title || 'Untitled'}
      </h4>

      {/* Subtitle / Status */}
      {(item.subtitle || item.status) && (
        <div className="mt-2 pt-2 border-t border-white/5">
          <span className="text-[10px] text-white/80">
            {item.subtitle || item.status}
          </span>
        </div>
      )}

      {/* Long press hint */}
      <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-30 transition-opacity">
        <span className="text-[7px] text-slate-600 uppercase">Hold to delete</span>
      </div>
    </div>
  );
};
