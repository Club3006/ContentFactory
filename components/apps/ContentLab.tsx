import React, { useState, useEffect, useRef } from 'react';
import { rewriteContent, generateVisual, refineContent, refineVisual, synthesizeContent } from '../../services/geminiService';
import { UserPersona } from '../../types';
import { dbService } from '../../services/dbService';
import { handleShiftEnter } from '../../utils/eventUtils';
import { fetchTranscript } from '../../services/apifyService';
import { Link, X, Plus, Loader2 } from 'lucide-react';

interface ContextSource {
  id: string;
  url: string;
  status: 'pending' | 'processing' | 'ready' | 'error';
  content?: string;
  error?: string;
}

const ContentLab: React.FC = () => {
  // Seed Quote
  const [seedQuote, setSeedQuote] = useState('');
  
  // Multi-source state
  const [sources, setSources] = useState<ContextSource[]>([]);
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  
  // Generation state
  const [targetPlatform, setTargetPlatform] = useState('LinkedIn');
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16">("1:1");
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState('');
  const [resultImage, setResultImage] = useState('');
  const [refineInput, setRefineInput] = useState('');
  const [refining, setRefining] = useState(false);
  const [activePersona, setActivePersona] = useState<UserPersona | null>(null);

  const originalImagePrompt = useRef('');

  useEffect(() => {
    const savedPersonas = localStorage.getItem('retro_personas');
    const activeId = localStorage.getItem('active_persona_id');
    if (savedPersonas) {
      const parsed = JSON.parse(savedPersonas);
      const active = parsed.find((p: UserPersona) => p.id === activeId) || parsed[0];
      setActivePersona(active);
    }
  }, []);

  // Get border class based on source status
  const getSourceBorderClass = (status: string) => {
    switch (status) {
      case 'processing':
        return 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)] bg-yellow-500/5';
      case 'ready':
        return 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] bg-emerald-500/5';
      case 'error':
        return 'border-red-500 bg-red-500/5';
      default:
        return 'border-slate-700';
    }
  };

  // Add a new source
  const handleAddSource = () => {
    if (!newSourceUrl.trim()) return;
    
    const newSource: ContextSource = {
      id: Date.now().toString(),
      url: newSourceUrl.trim(),
      status: 'pending'
    };
    
    setSources(prev => [...prev, newSource]);
    setNewSourceUrl('');
  };

  // Remove a source
  const handleRemoveSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
  };

  // Ingest a single source
  const ingestSource = async (source: ContextSource): Promise<ContextSource> => {
    try {
      const result = await fetchTranscript(source.url);
      return {
        ...source,
        status: 'ready',
        content: result.transcriptText
      };
    } catch (e) {
      return {
        ...source,
        status: 'error',
        error: e instanceof Error ? e.message : 'Unknown error'
      };
    }
  };

  // Ingest all sources
  const handleIngestAll = async () => {
    if (sources.length === 0) return;
    
    setIsIngesting(true);
    
    // Set all pending sources to processing
    setSources(prev => prev.map(s => 
      s.status === 'pending' ? { ...s, status: 'processing' as const } : s
    ));

    // Process sources in parallel
    const pendingSources = sources.filter(s => s.status === 'pending' || s.status === 'processing');
    
    for (const source of pendingSources) {
      // Update to processing
      setSources(prev => prev.map(s => 
        s.id === source.id ? { ...s, status: 'processing' as const } : s
      ));
      
      // Ingest
      const result = await ingestSource(source);
      
      // Update with result
      setSources(prev => prev.map(s => 
        s.id === source.id ? result : s
      ));
    }

    setIsIngesting(false);
  };

  // Check if all sources are ready
  const allSourcesReady = sources.length > 0 && sources.every(s => s.status === 'ready');
  const hasProcessingSources = sources.some(s => s.status === 'processing');

  // Generate content using quote + context
  const handleGenerate = async () => {
    if (!seedQuote.trim()) {
      alert("Please enter a seed quote.");
      return;
    }

    setLoading(true);
    setResultText('');
    setResultImage('');

    try {
      // Gather context from all ready sources
      const contextTexts = sources
        .filter(s => s.status === 'ready' && s.content)
        .map(s => s.content!)
        .join('\n\n---\n\n');

      // Generate synthesized content
      const synthesized = await synthesizeContent(
        seedQuote,
        contextTexts,
        targetPlatform,
        activePersona
      );
      
      setResultText(synthesized);

      // Generate visual if persona has branding
      if (activePersona?.branding) {
        originalImagePrompt.current = `A high-end visual for ${targetPlatform} using ${activePersona.branding} style. Subject: ${seedQuote.substring(0, 80)}. Aspect: ${aspectRatio}.`;
        const img = await generateVisual(originalImagePrompt.current, aspectRatio);
        setResultImage(img);
      }
    } catch (e) {
      console.error(e);
      setResultText("Generation failed. Please verify configuration.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!resultText) return;

    try {
      await dbService.addGeneratedContent({
        ideaId: 'synthesized-' + Date.now(),
        platform: targetPlatform as any,
        contentBody: resultText,
        isPublished: false,
        tags: [activePersona?.name || 'default', targetPlatform, 'synthesized'],
        metadata: {
          seedQuote,
          sourceCount: sources.length,
          imageUrl: resultImage,
          aspectRatio,
          personaId: activePersona?.id
        }
      });
      alert("Content saved to Library!");
    } catch (e) {
      console.error("Save failed:", e);
      alert("Failed to save content.");
    }
  };

  const handleRefine = async () => {
    if (!refineInput.trim() || refining || !activePersona) return;
    setRefining(true);
    const feedback = refineInput;
    setRefineInput('');

    try {
      const isVisualFeedback = /image|picture|visual|look|photo|style|color|aesthetic/i.test(feedback);

      if (isVisualFeedback) {
        const newImg = await refineVisual(originalImagePrompt.current, feedback, aspectRatio);
        setResultImage(newImg);
      } else {
        const newText = await refineContent(resultText, feedback, activePersona);
        setResultText(newText);
      }
    } catch (e) {
      console.error("Refinement error:", e);
    } finally {
      setRefining(false);
    }
  };

  return (
    <div className="space-y-4 font-mono h-full overflow-y-auto">
      <div className="flex flex-col gap-3">
        {/* Active Identity */}
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Active Identity</label>
          <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-[10px] text-blue-400 font-black uppercase">
            {activePersona ? activePersona.name : 'No Identity Selected'}
          </div>
        </div>

        {/* Seed Quote */}
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Seed Quote (paste from podcast)</label>
          <textarea
            value={seedQuote}
            onChange={(e) => setSeedQuote(e.target.value)}
            placeholder="Paste your notable quote here..."
            rows={3}
            className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-xs text-slate-200 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600 resize-none"
          />
        </div>

        {/* Context Sources */}
        <div className="space-y-2">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Context Sources</label>
          
          {/* Existing Sources */}
          <div className="space-y-2">
            {sources.map(source => (
              <div
                key={source.id}
                className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${getSourceBorderClass(source.status)} ${source.status === 'processing' ? 'animate-pulse' : ''}`}
              >
                <Link size={14} className="text-slate-500 shrink-0" />
                <span className="flex-1 text-xs text-slate-300 truncate">{source.url}</span>
                
                {/* Status indicator */}
                <span className={`text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                  source.status === 'ready' ? 'text-emerald-400' :
                  source.status === 'processing' ? 'text-yellow-400' :
                  source.status === 'error' ? 'text-red-400' :
                  'text-slate-500'
                }`}>
                  {source.status === 'ready' && 'Ready ✓'}
                  {source.status === 'processing' && 'Processing...'}
                  {source.status === 'error' && 'Failed'}
                  {source.status === 'pending' && 'Pending'}
                </span>
                
                {/* Remove button */}
                <button
                  onClick={() => handleRemoveSource(source.id)}
                  className="text-slate-600 hover:text-red-400 transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Add New Source */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newSourceUrl}
              onChange={(e) => setNewSourceUrl(e.target.value)}
              placeholder="Paste URL (article, YouTube, web page...)"
              className="flex-1 bg-slate-900 border border-slate-700 p-2 rounded-lg text-xs text-slate-200 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
              onKeyDown={(e) => e.key === 'Enter' && handleAddSource()}
            />
            <button
              onClick={handleAddSource}
              disabled={!newSourceUrl.trim()}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1"
            >
              <Plus size={12} />
              Add
            </button>
          </div>

          {/* Ingest All Button */}
          {sources.length > 0 && (
            <button
              onClick={handleIngestAll}
              disabled={isIngesting || allSourcesReady}
              className={`w-full h-10 font-black rounded-lg text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                isIngesting || hasProcessingSources
                  ? 'bg-yellow-500/10 border-2 border-yellow-500 text-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.3)] animate-pulse'
                  : allSourcesReady
                    ? 'bg-emerald-500/10 border-2 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white border-2 border-transparent'
              }`}
            >
              {isIngesting || hasProcessingSources ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  PROCESSING...
                </>
              ) : allSourcesReady ? (
                'ALL SOURCES READY ✓'
              ) : (
                'INGEST ALL SOURCES'
              )}
            </button>
          )}
        </div>

        {/* Channel & Ratio */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Channel</label>
            <select
              value={targetPlatform}
              onChange={(e) => setTargetPlatform(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-xs text-slate-200 outline-none"
            >
              <option>LinkedIn</option>
              <option>YouTube</option>
              <option>Instagram</option>
              <option>Twitter/X</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Ratio</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-xs text-slate-200 outline-none"
            >
              <option value="1:1">1:1 Square</option>
              <option value="16:9">16:9 Landscape</option>
              <option value="9:16">9:16 Portrait</option>
            </select>
          </div>
        </div>
      </div>

      {/* Execute Button */}
      <button
        onClick={handleGenerate}
        disabled={loading || !seedQuote.trim()}
        className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white font-black rounded-lg text-[10px] transition-all uppercase tracking-widest shadow-lg shadow-indigo-900/20"
      >
        {loading ? 'SYNTHESIZING CONTENT...' : 'EXECUTE PRODUCTION'}
      </button>

      {/* Results */}
      {(resultText || loading) && (
        <div className="space-y-4 pt-2 border-t border-slate-800 animate-in fade-in slide-in-from-bottom-2">
          {loading && !resultText && (
            <div className="h-24 flex items-center justify-center border border-dashed border-slate-800 rounded-xl">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-700 animate-pulse">Synthesizing Content from Quote + Sources...</span>
            </div>
          )}

          {resultText && (
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 relative group">
              <div className="text-[10px] text-slate-300 leading-relaxed whitespace-pre-wrap mb-4 font-mono">
                {resultText}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Refine</span>
                  {refining && <div className="w-1 h-1 bg-indigo-400 rounded-full animate-pulse"></div>}
                </div>
                <div className="relative">
                  <textarea
                    value={refineInput}
                    onChange={(e) => setRefineInput(e.target.value)}
                    onKeyDown={(e) => handleShiftEnter(e, handleRefine)}
                    disabled={refining}
                    rows={1}
                    placeholder="[ INSTRUCTIONS... ]"
                    className="w-full bg-transparent border border-transparent rounded-lg px-3 py-2 text-[10px] text-indigo-300 outline-none focus:border-emerald-500 focus:bg-emerald-500/30 transition-all resize-none font-mono min-h-[38px]"
                  />
                </div>
              </div>

              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleSaveToLibrary}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/50 px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  Save to Library
                </button>
              </div>
            </div>
          )}

          {resultImage && (
            <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden relative group">
              <img src={resultImage} alt="Visual Asset" className="w-full h-auto" />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={resultImage}
                  download="asset_pro.png"
                  className="bg-white/90 backdrop-blur-sm text-slate-900 px-2 py-1 rounded text-[8px] font-black uppercase hover:bg-white transition-colors"
                >
                  SAVE
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContentLab;
