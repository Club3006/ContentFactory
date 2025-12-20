
import React, { useState, useCallback, useEffect } from 'react';
import { AppType, WindowState, ContentIdea } from './types';
import Window from './components/Window';
import IdeaLog from './components/apps/IdeaLog';
import ContentLab from './components/apps/ContentLab';
import ChatBot from './components/apps/ChatBot';
import Settings from './components/apps/Settings';
import IdeaDetail from './components/apps/IdeaDetail';
import Library from './components/apps/Library';

const App: React.FC = () => {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [maxZ, setMaxZ] = useState(10);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Initial Boot Sequence
  useEffect(() => {
    setTimeout(() => {
      openApp('chatbot', 'Neural Assistant', null, 400, 100);
    }, 500);
  }, []);

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

  const handleIdeaDigested = (idea: ContentIdea) => {
    openApp('idea-detail', `Asset: ${idea.content.substring(0, 15)}...`, idea, window.innerWidth - 560, 100);
  };

  const apps = [
    { type: 'idea-log', name: 'Idea Capture', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5' },
    { type: 'library', name: 'Vault', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { type: 'content-lab', name: 'Generator', icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 011 1V4z' },
    { type: 'chatbot', name: 'Assistant', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
    { type: 'settings', name: 'Persona', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' }
  ];

  return (
    <div className="h-screen w-screen flex bg-transparent text-slate-200 overflow-hidden font-sans select-none">
      
      {/* Side Navigation */}
      <div className="w-16 flex flex-col items-center py-6 bg-slate-950/40 backdrop-blur-md border-r border-white/5 z-[1000] shrink-0">
        <div className="mb-10 text-blue-500/80 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 10-2 0H18zM15.657 14.243a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707zM11 17a1 1 0 10-2 0v1a1 1 0 102 0v-1zM4.343 14.243a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM2 10a1 1 0 102 0H2zM4.343 5.757a1 1 0 001.414 1.414l.707-.707a1 1 0 00-1.414-1.414l-.707.707z" /></svg>
        </div>
        
        <div className="flex flex-col gap-6">
          {apps.map(app => (
            <button 
              key={app.type}
              onClick={() => openApp(app.type as AppType, app.name)} 
              className="p-3 rounded-2xl hover:bg-white/5 text-slate-500 hover:text-blue-400 transition-all group relative border border-transparent hover:border-white/10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={app.icon} /></svg>
              <span className="absolute left-20 bg-slate-900/90 backdrop-blur-xl px-3 py-1.5 rounded text-[10px] font-black uppercase hidden group-hover:block whitespace-nowrap border border-white/10 z-50 tracking-[0.2em] shadow-2xl">{app.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-grow flex flex-col relative overflow-hidden">
        {/* Top Header Bar */}
        <div className="h-14 bg-slate-950/20 backdrop-blur-sm border-b border-white/5 flex items-center px-6 justify-between z-10 shrink-0">
          <div className="flex items-center gap-6">
            <h1 className="text-[11px] font-black tracking-[0.4em] text-white/90 uppercase italic drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
              CONTENT FACTORY <span className="text-blue-500 not-italic">ORBITAL</span>
            </h1>
            <div className="hidden md:flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Neural Link Active</span>
            </div>
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar max-w-[50%]">
            {windows.map(win => (
              <button 
                key={win.id} 
                onClick={() => focusWindow(win.id)} 
                className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${win.isMinimized ? 'bg-white/5 text-slate-600 border-transparent opacity-40' : 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]'}`}
              >
                {win.title}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-grow relative p-4 overflow-hidden">
          {windows.map((win) => (
            <Window 
              key={win.id} 
              title={win.title} 
              onClose={() => closeWindow(win.id)}
              onFocus={() => focusWindow(win.id)}
              zIndex={win.zIndex}
              initialPos={{ x: win.initialX || 100, y: win.initialY || 100 }}
            >
              {win.type === 'idea-log' && <IdeaLog onIdeaDigested={handleIdeaDigested} />}
              {win.type === 'content-lab' && <ContentLab />}
              {win.type === 'chatbot' && <ChatBot />}
              {win.type === 'settings' && <Settings />}
              {win.type === 'idea-detail' && <IdeaDetail idea={win.data} />}
              {win.type === 'library' && (
                <Library 
                  onSelectIdea={(idea) => openApp('idea-detail', `Asset: ${idea.content.substring(0, 15)}...`, idea, window.innerWidth - 560, 100)} 
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
