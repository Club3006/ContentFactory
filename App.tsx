import React, { useState, useCallback, useEffect } from 'react';
import { AppType, WindowState, ContentIdea, VaultItem } from './types';
import Window from './components/Window';
import IdeaLog from './components/apps/IdeaLog';
import ContentLab from './components/apps/ContentLab';
import Settings from './components/apps/Settings';
import IdeaDetail from './components/apps/IdeaDetail';
import { UnifiedVault } from './components/apps/UnifiedVault';
import { PodcastProducer } from './components/apps/PodcastProducer';
import { PodcastLibrary } from './components/apps/PodcastLibrary';
import { PodcastDetail } from './components/apps/PodcastDetail';
import { PodcastTranscript } from './components/apps/PodcastTranscript';
import { LinkedInCreator } from './components/apps/LinkedInCreator';
import { GripVertical } from 'lucide-react';

interface SidebarApp {
  type: string;
  name: string;
  icon: string;
}

const DEFAULT_APPS: SidebarApp[] = [
  { type: 'idea-log', name: 'Idea Capture', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5' },
  { type: 'unified-vault', name: 'Vault', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { type: 'content-lab', name: 'Generator', icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 011 1V4z' },
  { type: 'linkedin-creator', name: 'LinkedIn Creator', icon: 'M20 2H4a2 2 0 00-2 2v16a2 2 0 002 2h16a2 2 0 002-2V4a2 2 0 00-2-2zM8 19H5V9h3v10zM6.5 7.5A1.5 1.5 0 118 6a1.5 1.5 0 01-1.5 1.5zM19 19h-3v-5.5c0-1.1-.9-2-2-2s-2 .9-2 2V19h-3V9h3v1.5c.5-.8 1.5-1.5 2.5-1.5 2.2 0 4 1.8 4 4V19z' },
  { type: 'settings', name: 'Persona', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
  { type: 'podcast-producer', name: 'Podcast Scraper', icon: 'M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z M19 10v2a7 7 0 01-14 0v-2 M12 19v4 M8 23h8' }
];

const App: React.FC = () => {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [maxZ, setMaxZ] = useState(10);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Draggable sidebar state
  const [apps, setApps] = useState<SidebarApp[]>(() => {
    const saved = localStorage.getItem('sidebar_order');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Validate that all default apps are present
        const validApps = parsed.filter((app: SidebarApp) => 
          DEFAULT_APPS.some(d => d.type === app.type)
        );
        // Add any missing apps
        DEFAULT_APPS.forEach(defaultApp => {
          if (!validApps.find((a: SidebarApp) => a.type === defaultApp.type)) {
            validApps.push(defaultApp);
          }
        });
        return validApps;
      } catch {
        return DEFAULT_APPS;
      }
    }
    return DEFAULT_APPS;
  });
  
  const [draggedApp, setDraggedApp] = useState<string | null>(null);
  const [dragOverApp, setDragOverApp] = useState<string | null>(null);

  // Save sidebar order to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar_order', JSON.stringify(apps));
  }, [apps]);

  // Command Palette Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
      if (e.key === 'Escape') setShowCommandPalette(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openApp = useCallback((type: AppType, title: string, data?: any, initialX?: number, initialY?: number) => {
    const existing = (type === 'idea-detail' && data?.id)
      ? windows.find(w => w.data?.id === data.id)
      : windows.find(w => w.type === type && type !== 'idea-detail');

    if (existing) {
      focusWindow(existing.id);
      setShowCommandPalette(false);
      return;
    }

    const newZ = maxZ + 1;
    setMaxZ(newZ);
    const newWindow: WindowState = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title,
      zIndex: newZ,
      isOpen: true,
      isMinimized: false,
      data,
      initialX: initialX || 120 + (windows.length * 30),
      initialY: initialY || 80 + (windows.length * 30)
    };
    setWindows(prev => [...prev, newWindow]);
    setShowCommandPalette(false);
  }, [windows, maxZ]);

  const closeWindow = (id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  };

  const focusWindow = (id: string) => {
    const newZ = maxZ + 1;
    setMaxZ(newZ);
    setWindows(prev => prev.map(w => w.id === id ? { ...w, zIndex: newZ, isOpen: true, isMinimized: false } : w));
  };

  const toggleMaximize = (id: string) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, isMaximized: !w.isMaximized } : { ...w, isMaximized: false }
    ));
  };

  // Auto-layout calculation based on maximized window
  const calculateLayout = (winState: WindowState, index: number, allWindows: WindowState[]) => {
    const screenWidth = typeof globalThis.window !== 'undefined' ? globalThis.window.innerWidth - 60 : 1920;
    const screenHeight = typeof globalThis.window !== 'undefined' ? globalThis.window.innerHeight : 1080;
    const sidebarWidth = 60;
    const workspaceWidth = screenWidth - sidebarWidth;

    const maximizedWindow = allWindows.find(w => w.isMaximized);

    if (winState.isMaximized) {
      return {
        x: sidebarWidth,
        y: 0,
        width: Math.floor(workspaceWidth / 3),
        height: screenHeight
      };
    } else if (maximizedWindow) {
      const remainingWindows = allWindows.filter(w => !w.isMaximized);
      const windowIndex = remainingWindows.indexOf(winState);
      const totalRemaining = remainingWindows.length;
      const leftOffset = sidebarWidth + Math.floor(workspaceWidth / 3);
      const remainingWidth = workspaceWidth - Math.floor(workspaceWidth / 3);
      const heightPerWindow = Math.floor(screenHeight / totalRemaining);

      return {
        x: leftOffset,
        y: windowIndex * heightPerWindow,
        width: remainingWidth,
        height: heightPerWindow
      };
    }

    return null;
  };

  const handleIdeaDigested = (idea: ContentIdea) => {
    openApp('idea-detail', `Asset: ${idea.content.substring(0, 15)}...`, idea, window.innerWidth - 560, 100);
  };

  // Handle opening items from the Unified Vault
  const handleVaultItemOpen = (item: VaultItem) => {
    switch (item.type) {
      case 'idea':
        openApp('idea-detail', `Asset: ${item.title.substring(0, 15)}...`, item.originalData, window.innerWidth - 560, 100);
        break;
      case 'podcast':
        openApp('podcast-detail', `Ep ${item.originalData.episodeNumber}: ${item.title.substring(0, 20)}...`, item.originalData, window.innerWidth - 600, 100);
        break;
      case 'generator':
        openApp('content-lab', 'Generator', item.originalData, window.innerWidth - 700, 100);
        break;
      case 'linkedin':
        openApp('linkedin-creator', 'LinkedIn Creator', item.originalData, window.innerWidth - 600, 100);
        break;
    }
  };

  // Sidebar drag handlers
  const handleDragStart = (e: React.DragEvent, appType: string) => {
    setDraggedApp(appType);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, appType: string) => {
    e.preventDefault();
    if (draggedApp && draggedApp !== appType) {
      setDragOverApp(appType);
    }
  };

  const handleDragEnd = () => {
    if (draggedApp && dragOverApp) {
      const newApps = [...apps];
      const draggedIndex = newApps.findIndex(a => a.type === draggedApp);
      const dropIndex = newApps.findIndex(a => a.type === dragOverApp);
      
      if (draggedIndex !== -1 && dropIndex !== -1) {
        const [removed] = newApps.splice(draggedIndex, 1);
        newApps.splice(dropIndex, 0, removed);
        setApps(newApps);
      }
    }
    setDraggedApp(null);
    setDragOverApp(null);
  };

  return (
    <div className="h-screen w-screen flex bg-transparent text-slate-200 overflow-hidden font-sans select-none">

      {/* Side Navigation - Draggable */}
      <div className="w-16 flex flex-col items-center py-6 bg-slate-950/40 backdrop-blur-md border-r border-white/5 z-[1000] shrink-0">
        <div className="mb-10 text-blue-500/80 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 10-2 0H18zM15.657 14.243a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707zM11 17a1 1 0 10-2 0v1a1 1 0 102 0v-1zM4.343 14.243a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM2 10a1 1 0 102 0H2zM4.343 5.757a1 1 0 001.414 1.414l.707-.707a1 1 0 00-1.414-1.414l-.707.707z" /></svg>
        </div>

        <div className="flex flex-col gap-6">
          {apps.map(app => (
            <div
              key={app.type}
              draggable
              onDragStart={(e) => handleDragStart(e, app.type)}
              onDragOver={(e) => handleDragOver(e, app.type)}
              onDragEnd={handleDragEnd}
              className={`relative group ${dragOverApp === app.type ? 'scale-110' : ''} ${draggedApp === app.type ? 'opacity-50' : ''} transition-all`}
            >
              <button
                onClick={() => openApp(app.type as AppType, app.name)}
                className={`p-3 rounded-2xl hover:bg-white/5 text-slate-500 hover:text-blue-400 transition-all group relative border ${dragOverApp === app.type ? 'border-blue-500 bg-blue-500/10' : 'border-transparent hover:border-white/10'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={app.icon} /></svg>
                <span className="absolute left-20 bg-slate-900/90 backdrop-blur-xl px-3 py-1.5 rounded text-[10px] font-black uppercase hidden group-hover:block whitespace-nowrap border border-white/10 z-50 tracking-[0.2em] shadow-2xl">{app.name}</span>
              </button>
              {/* Drag handle indicator on hover */}
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none">
                <GripVertical size={10} className="text-slate-500" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-grow flex flex-col relative overflow-hidden">
        {/* Top Header Bar */}
        <div className="h-[14px] bg-slate-950/20 backdrop-blur-sm border-b border-white/5 flex items-center px-4 justify-between z-10 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-[11px] font-black tracking-[0.4em] text-white/90 uppercase italic drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
              CONTENT FACTORY <span className="text-blue-500 not-italic">ORBITAL</span>
            </h1>
            <div className="hidden md:flex items-center gap-2 bg-white/5 px-2 py-0 rounded-full border border-white/5">
              <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Neural Link Active</span>
            </div>
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar max-w-[50%]">
            {windows.map(win => (
              <button
                key={win.id}
                onClick={() => focusWindow(win.id)}
                className={`px-3 py-0 rounded-full text-[8px] font-black uppercase tracking-widest transition-all border whitespace-nowrap leading-tight ${win.isMinimized ? 'bg-white/5 text-slate-600 border-transparent opacity-40' : 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]'}`}
              >
                {win.title}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-grow relative p-4 overflow-hidden">
          {windows.map((win, index) => (
            <Window
              key={win.id}
              title={win.title}
              onClose={() => closeWindow(win.id)}
              onFocus={() => focusWindow(win.id)}
              onToggleMaximize={() => toggleMaximize(win.id)}
              zIndex={win.zIndex}
              initialPos={{ x: win.initialX || 100, y: win.initialY || 100 }}
              autoLayout={calculateLayout(win, index, windows)}
              isMaximized={win.isMaximized}
            >
              {win.type === 'idea-log' && <IdeaLog onIdeaDigested={handleIdeaDigested} />}
              {win.type === 'content-lab' && <ContentLab initialData={win.data} />}
              {win.type === 'settings' && <Settings />}
              {win.type === 'idea-detail' && <IdeaDetail idea={win.data} />}
              {win.type === 'unified-vault' && (
                <UnifiedVault onItemOpen={handleVaultItemOpen} />
              )}
              {win.type === 'podcast-producer' && (
                <PodcastProducer
                  onClose={() => closeWindow(win.id)}
                  onSaved={() => openApp('unified-vault', 'Vault', null, window.innerWidth - 900, 100)}
                />
              )}
              {win.type === 'podcast-library' && (
                <PodcastLibrary
                  onSelectEpisode={(ep) => openApp('podcast-detail', `Ep ${ep.episodeNumber}: ${ep.title.substring(0, 20)}...`, ep, window.innerWidth - 600, 100)}
                />
              )}
              {win.type === 'podcast-detail' && (
                <PodcastDetail
                  episode={win.data}
                  onViewTranscript={() => openApp('podcast-transcript', `Transcript: Ep ${win.data.episodeNumber}`, { 
                    title: win.data.title, 
                    transcript: win.data.transcriptText,
                    episodeId: win.data.id,
                    guest: win.data.guest,
                    ratedQuotes: win.data.ratedQuotes
                  }, window.innerWidth - 800, 50)}
                />
              )}
              {win.type === 'podcast-transcript' && (
                <PodcastTranscript
                  title={win.data.title}
                  transcript={win.data.transcript}
                  episodeId={win.data.episodeId}
                  guest={win.data.guest}
                  initialQuotes={win.data.ratedQuotes || []}
                />
              )}
              {win.type === 'linkedin-creator' && (
                <LinkedInCreator 
                  onClose={() => closeWindow(win.id)} 
                  initialData={win.data}
                  onSaved={() => openApp('unified-vault', 'Vault', null, window.innerWidth - 900, 100)}
                />
              )}
            </Window>
          ))}
        </div>
      </div>

      {/* Command Palette Overlay */}
      {showCommandPalette && (
        <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-[15vh] px-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-2xl shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="flex items-center px-5 py-4 border-b border-white/5 bg-white/5">
              <svg className="w-5 h-5 text-slate-500 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                autoFocus
                type="text"
                placeholder="Jump to..."
                className="w-full bg-transparent text-sm text-white placeholder-slate-600 outline-none font-mono"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="flex gap-1 items-center">
                <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">ESC</span>
              </div>
            </div>
            <div className="p-2">
              {apps.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())).map(app => (
                <button
                  key={app.type}
                  onClick={() => openApp(app.type as AppType, app.name)}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-600/20 text-slate-400 hover:text-blue-400 transition-all text-left group"
                >
                  <div className="p-2 rounded-lg bg-white/5 group-hover:bg-blue-500/20">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={app.icon} /></svg>
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">{app.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
