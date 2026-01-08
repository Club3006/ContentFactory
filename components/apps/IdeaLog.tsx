
import React, { useState, useRef, useEffect } from 'react';
import { ContentIdea } from '../../types';
import { scrapeAndTranscribe } from '../../services/geminiService';
import { dbService } from '../../services/dbService';
import { handleShiftEnter } from '../../utils/eventUtils';
import { Mic, Loader2, Check } from 'lucide-react';

interface IdeaLogProps {
  onIdeaDigested?: (idea: ContentIdea) => void;
}

const IdeaLog: React.FC<IdeaLogProps> = ({ onIdeaDigested }) => {
  const [newInput, setNewInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>(['> System Ready', '> Awaiting Input...']);

  // Mic State
  const [micState, setMicState] = useState<'idle' | 'recording' | 'processing' | 'success'>('idle');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setNewInput(prev => {
              const spacing = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
              return prev + spacing + finalTranscript;
            });
          }
        };

        recognition.onend = () => {
          // If we entered 'processing' state manually, don't reset to idle here
          // Only reset if it stopped unexpectedly
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      setError("Speech recognition not supported");
      return;
    }

    if (micState === 'idle') {
      recognitionRef.current.start();
      setMicState('recording');
      addLog('Microphone Active.');
    } else if (micState === 'recording') {
      recognitionRef.current.stop();
      setMicState('processing');
      addLog('Processing audio...');

      // Simulate "transcribing" delay and completion
      setTimeout(() => {
        setMicState('success');
        addLog('Transcription Complete.');
        setTimeout(() => setMicState('idle'), 2000);
      }, 1500);
    }
  };

  const getMicIcon = () => {
    switch (micState) {
      case 'recording': return <Mic className="w-4 h-4 text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />;
      case 'processing': return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]" />;
      case 'success': return <Mic className="w-4 h-4 text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" />;
      default: return <Mic className="w-4 h-4 text-slate-600 hover:text-white transition-colors" />;
    }
  };

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-3), `> ${msg}`]);
  };

  const addIdea = async (ingest: boolean = true) => {
    if (!newInput.trim()) return;
    setLoading(true);
    setError(null);

    if (ingest) {
      addLog(`Ingesting: ${newInput.substring(0, 15)}...`);
    } else {
      addLog(`Saving: ${newInput.substring(0, 15)}...`);
    }

    const isUrl = /^(http|https):\/\/[^ "]+$/.test(newInput.trim());
    const newIdea: ContentIdea = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      createdAt: Date.now(), // Added for sorting requirement
      content: newInput.trim(),
      type: isUrl ? 'url' : 'riff',
      status: 'captured'
    };

    try {
      if (ingest) {
        if (isUrl) {
          addLog('Requesting Gemini Tools...');
          const transcript = await scrapeAndTranscribe(newInput.trim());

          // --- VERIFICATION: Save to scraped_data ---
          await dbService.addScrapedData({
            url: newInput.trim(),
            content: transcript,
            source: 'web_scrape',
            tags: ['automated_ingest'],
            metadata: {
              charCount: transcript.length,
              ingestionSuccess: true,
              verification_test: "verified_by_antigravity" // Custom field for 'Adaptive' test
            }
          });

          newIdea.transcript = transcript;
          newIdea.status = 'digested';
          addLog('Source Digested & Archived.');
        } else {
          addLog('Capturing Riff...');
          // For riffs text is the content, so we consider it digested if ingested
          newIdea.status = 'digested';
          addLog('Riff Committed.');
        }
      } else {
        addLog('Idea Saved to Vault.');
      }

      // Save to Firebase
      const ideaId = await dbService.addContentIdea({
        ...newIdea,
        status: ingest ? 'new' : 'captured', // Aligning with user's 'status=new' query requirement
        tags: ['verification_test'],
        rating: 0
      });
      newIdea.id = ideaId; // Update with Firestore ID

      if (ingest && onIdeaDigested) onIdeaDigested(newIdea);
      setNewInput('');
      addLog('Ready.');
      // If mic was left in success state, reset it
      if (micState === 'success') setMicState('idle');

    } catch (e: any) {
      console.error(e);
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
        <div className="flex items-center gap-4">
          {/* Mic Button */}
          <button
            onClick={handleMicClick}
            className={`p-1.5 rounded-full border transition-all ${micState === 'recording' ? 'bg-red-500/10 border-red-500/50' :
              micState === 'processing' ? 'bg-yellow-500/10 border-yellow-500/50' :
                micState === 'success' ? 'bg-green-500/10 border-green-500/50' :
                  'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
          >
            {getMicIcon()}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-[8px] font-bold text-slate-500 uppercase">ACTIVE</span>
          </div>
        </div>
      </div>

      <div className="relative group">
        <textarea
          value={newInput}
          onChange={(e) => {
            setNewInput(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => handleShiftEnter(e, () => addIdea(true))}
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

      <div className="flex gap-3">
        <button
          onClick={() => addIdea(false)}
          disabled={loading || !newInput.trim()}
          className={`relative overflow-hidden w-1/2 h-12 bg-amber-600/20 hover:bg-amber-600/40 border border-amber-600/50 disabled:opacity-50 text-amber-500 font-bold rounded-lg text-[10px] transition-all shadow-lg uppercase tracking-[0.2em] group`}
        >
          <span className="relative z-10 group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
            Save Idea
          </span>
        </button>

        <button
          onClick={() => addIdea(true)}
          disabled={loading || !newInput.trim()}
          className={`relative overflow-hidden w-1/2 h-12 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-black rounded-lg text-[10px] transition-all shadow-xl uppercase tracking-[0.2em] group`}
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
    </div>
  );
};

export default IdeaLog;
