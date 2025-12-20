
import React, { useState } from 'react';
import { ContentIdea } from '../../types';
import { scrapeAndTranscribe } from '../../services/geminiService';
import { handleShiftEnter } from '../../utils/eventUtils';

interface IdeaLogProps {
  onIdeaDigested?: (idea: ContentIdea) => void;
}

const IdeaLog: React.FC<IdeaLogProps> = ({ onIdeaDigested }) => {
  const [newInput, setNewInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>(['> System Ready', '> Awaiting Input...']);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-3), `> ${msg}`]);
  };

  const addIdea = async () => {
    if (!newInput.trim()) return;
    setLoading(true);
    setError(null);
    addLog(`Ingesting: ${newInput.substring(0, 15)}...`);

    const isUrl = /^(http|https):\/\/[^ "]+$/.test(newInput.trim());
    const newIdea: ContentIdea = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      content: newInput.trim(),
      type: isUrl ? 'url' : 'riff',
      status: 'captured'
    };

    try {
      if (isUrl) {
        addLog('Requesting Gemini Tools...');
        const transcript = await scrapeAndTranscribe(newInput.trim());
        newIdea.transcript = transcript;
        newIdea.status = 'digested';
        addLog('Source Digested.');
      } else {
        addLog('Capturing Riff...');
        newIdea.status = 'digested';
        addLog('Riff Committed.');
      }
      
      const saved = localStorage.getItem('retro_content_ideas');
      const ideas = saved ? JSON.parse(saved) : [];
      const updatedIdeas = [newIdea, ...ideas];
      localStorage.setItem('retro_content_ideas', JSON.stringify(updatedIdeas));
      
      if (onIdeaDigested) onIdeaDigested(newIdea);
      setNewInput('');
      addLog('Ready.');
    } catch (e: any) {
      setError(e.message || "Ingestion failed.");
      addLog('ERROR: Failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 font-mono">
      <div className="flex items-center justify-between">
        <h3 className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em]">Capture Terminal</h3>
        <div className="flex items-center gap-2">
           <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"></div>
           <span className="text-[8px] font-bold text-slate-500 uppercase">ACTIVE</span>
        </div>
      </div>
      
      <div className="relative group">
        <textarea
          value={newInput}
          onChange={(e) => {
            setNewInput(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => handleShiftEnter(e, addIdea)}
          disabled={loading}
          className={`w-full p-3 bg-black border ${error ? 'border-red-500/50' : 'border-slate-800'} rounded-lg text-xs min-h-[160px] focus:border-blue-500 outline-none transition-all placeholder-slate-900 custom-scrollbar font-mono text-blue-400/90 shadow-inner resize-none`}
          placeholder="[ ENTER URL OR RIFF ]"
          autoFocus
        />
        {!newInput && !loading && (
          <div className="absolute left-3 top-3 text-blue-500/20 pointer-events-none">
            <span className="blink !w-1.5 h-3"></span>
          </div>
        )}
      </div>

      <div className="bg-slate-950 p-2 rounded-lg border border-slate-900 min-h-[60px]">
        {logs.map((log, i) => (
          <div key={i} className="text-[9px] text-slate-600 tracking-tighter leading-tight animate-in fade-in duration-300">
            {log}
          </div>
        ))}
      </div>

      {error && (
        <div className="text-[9px] text-red-400 font-bold uppercase flex items-center gap-2 p-2 bg-red-500/5 border border-red-500/20 rounded-lg">
          {error}
        </div>
      )}

      <button 
        onClick={addIdea}
        disabled={loading || !newInput.trim()}
        className={`relative overflow-hidden w-full h-12 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-black rounded-lg text-[10px] transition-all shadow-xl uppercase tracking-[0.2em] group`}
      >
        {loading && (
          <div className="absolute inset-0 bg-blue-400/20">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full h-full animate-progress-slide"></div>
          </div>
        )}
        <span className="relative z-10">
          {loading ? 'EXECUTING...' : 'EXECUTE INGESTION'}
        </span>
      </button>
    </div>
  );
};

export default IdeaLog;
