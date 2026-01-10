import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { VaultItem, VaultItemType } from '../../types';
import { KanbanCard } from '../KanbanCard';

interface Props {
  onItemOpen: (item: VaultItem) => void;
}

type FilterType = 'all' | VaultItemType;

const FILTER_OPTIONS: { type: FilterType; label: string; color: string }[] = [
  { type: 'all', label: 'All', color: 'text-white' },
  { type: 'idea', label: 'Ideas', color: 'text-blue-400' },
  { type: 'podcast', label: 'Podcasts', color: 'text-emerald-400' },
  { type: 'generator', label: 'Generator', color: 'text-purple-400' },
  { type: 'linkedin', label: 'LinkedIn', color: 'text-[#0077B5]' },
];

export const UnifiedVault: React.FC<Props> = ({ onItemOpen }) => {
  // Persist filter selection
  const [activeFilter, setActiveFilter] = useState<FilterType>(() => {
    const saved = localStorage.getItem('vault_filter');
    return (saved as FilterType) || 'all';
  });

  useEffect(() => {
    localStorage.setItem('vault_filter', activeFilter);
  }, [activeFilter]);

  // Query all tables
  const ideas = useLiveQuery(() => db.ideas?.toArray() || Promise.resolve([]));
  const episodes = useLiveQuery(() => db.episodes.toArray());
  const generatorDrafts = useLiveQuery(() => db.generatorDrafts?.toArray() || Promise.resolve([]));
  const linkedInContent = useLiveQuery(() => db.linkedInContent?.toArray() || Promise.resolve([]));

  // Transform all data into unified VaultItems
  const allItems = useMemo((): VaultItem[] => {
    const items: VaultItem[] = [];

    // Ideas
    if (ideas) {
      ideas.forEach(idea => {
        items.push({
          id: idea.id,
          type: 'idea',
          title: idea.content?.substring(0, 50) || 'Untitled Idea',
          subtitle: idea.type === 'url' ? 'URL Source' : 'Riff',
          status: idea.status,
          createdAt: idea.createdAt || idea.timestamp,
          updatedAt: idea.createdAt || idea.timestamp,
          originalData: idea
        });
      });
    }

    // Episodes (Podcasts)
    if (episodes) {
      episodes.forEach(ep => {
        items.push({
          id: ep.id!,
          type: 'podcast',
          title: ep.title,
          subtitle: ep.guest ? `Guest: ${ep.guest}` : `Episode ${ep.episodeNumber}`,
          status: ep.status,
          createdAt: ep.createdAt,
          updatedAt: ep.updatedAt,
          originalData: ep
        });
      });
    }

    // Generator Drafts
    if (generatorDrafts) {
      generatorDrafts.forEach(draft => {
        items.push({
          id: draft.id!,
          type: 'generator',
          title: draft.title || draft.seedQuote?.substring(0, 40) || 'Untitled Draft',
          subtitle: `${draft.platform} • ${draft.status}`,
          status: draft.status,
          contentType: draft.status,
          createdAt: draft.createdAt,
          updatedAt: draft.updatedAt,
          originalData: draft
        });
      });
    }

    // LinkedIn Content
    if (linkedInContent) {
      linkedInContent.forEach(content => {
        items.push({
          id: content.id!,
          type: 'linkedin',
          title: content.title || content.contentBody?.substring(0, 40) || 'Untitled',
          subtitle: content.isPublished ? 'Published' : 'Draft',
          status: content.isPublished ? 'published' : 'draft',
          contentType: content.contentType,
          createdAt: content.createdAt,
          updatedAt: content.updatedAt,
          originalData: content
        });
      });
    }

    // Sort by most recently updated
    return items.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [ideas, episodes, generatorDrafts, linkedInContent]);

  // Filter items
  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return allItems;
    return allItems.filter(item => item.type === activeFilter);
  }, [allItems, activeFilter]);

  // Handle delete
  const handleDelete = async (item: VaultItem) => {
    try {
      switch (item.type) {
        case 'idea':
          await db.ideas?.delete(item.id as string);
          break;
        case 'podcast':
          await db.episodes.delete(item.id as number);
          break;
        case 'generator':
          await db.generatorDrafts?.delete(item.id as number);
          break;
        case 'linkedin':
          await db.linkedInContent?.delete(item.id as number);
          break;
      }
    } catch (e) {
      console.error('Failed to delete item:', e);
    }
  };

  const isLoading = ideas === undefined || episodes === undefined;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900">
        <div className="text-slate-500 text-xs font-mono animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900 font-mono text-slate-200">
      {/* Filter Bar - No header, just filters */}
      <div className="px-6 py-3 border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.type}
            onClick={() => setActiveFilter(opt.type)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeFilter === opt.type
                ? `bg-white/10 ${opt.color} border border-white/10`
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Kanban Grid */}
      <div className="flex-grow p-6 overflow-y-auto custom-scrollbar">
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map(item => (
              <KanbanCard
                key={`${item.type}-${item.id}`}
                item={item}
                onOpen={onItemOpen}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">
              {activeFilter === 'all' ? 'No items in vault' : `No ${activeFilter} items`}
            </p>
            <p className="text-slate-600 text-xs">
              Create content using the sidebar apps to populate your vault.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
