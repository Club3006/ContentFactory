
import React, { useState, useEffect, useRef } from 'react';
import { rewriteContent, generateVisual, refineContent, refineVisual } from '../../services/geminiService';
import { UserPersona, ContentIdea, FeedbackRating } from '../../types';
import { handleShiftEnter } from '../../utils/eventUtils';

const ContentLab: React.FC = () => {
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState('');
  const [targetPlatform, setTargetPlatform] = useState('Instagram');
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState('');
  const [resultImage, setResultImage] = useState('');
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16">("1:1");
  const [refineInput, setRefineInput] = useState('');
  const [refining, setRefining] = useState(false);
  const [activePersona, setActivePersona] = useState<UserPersona | null>(null);
  
  const originalImagePrompt = useRef('');

  useEffect(() => {
    const loadData = () => {
      const savedIdeas = localStorage.getItem('retro_content_ideas');
      if (savedIdeas) setIdeas(JSON.parse(savedIdeas));

      const savedPersonas = localStorage.getItem('retro_personas');
      const activeId = localStorage.getItem('active_persona_id');
      if (savedPersonas) {
        const parsed = JSON.parse(savedPersonas);
        const active = parsed.find((p: UserPersona) => p.id === activeId) || parsed[0];
        setActivePersona(active);
      }
    };
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const handleGenerate = async () => {
    const idea = ideas.find(i => i.id === selectedIdeaId);
    if (!idea || !activePersona) {
      if (!activePersona) alert("Please calibrate an Identity Profile in Persona settings first.");
      return;
    }

    setLoading(true);
    setResultText('');
    setResultImage('');

    try {
      const rewritten = await rewriteContent(
        idea.transcript || idea.content,
        activePersona,
        targetPlatform,
        []
      );
      setResultText(rewritten);

      originalImagePrompt.current = `A high-end visual for ${targetPlatform} using ${activePersona.branding} style for business: ${activePersona.businessInfo}. Subject: ${idea.content.substring(0, 80)}. Aspect: ${aspectRatio}.`;
      const img = await generateVisual(originalImagePrompt.current, aspectRatio);
      setResultImage(img);
    } catch (e) {
      console.error(e);
      setResultText("Generation failed. Please verify configuration.");
    } finally {
      setLoading(false);
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
    <div className="space-y-4 font-mono">
      <div className="flex flex-col gap-3">
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Active Identity</label>
          <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-[10px] text-blue-400 font-black uppercase">
            {activePersona ? activePersona.name : 'No Identity Selected'}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Source Asset</label>
          <select 
            value={selectedIdeaId}
            onChange={(e) => setSelectedIdeaId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-xs text-slate-200 focus:border-blue-500 outline-none cursor-pointer appearance-none"
          >
            <option value="">Choose Asset...</option>
            {ideas.map(i => (
              <option key={i.id} value={i.id}>{i.content.substring(0, 30)}...</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Channel</label>
            <select 
              value={targetPlatform}
              onChange={(e) => setTargetPlatform(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-xs text-slate-200 outline-none"
            >
              <option>Instagram</option>
              <option>YouTube</option>
              <option>LinkedIn</option>
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

      <button 
        onClick={handleGenerate}
        disabled={loading || !selectedIdeaId}
        className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white font-black rounded-lg text-[10px] transition-all uppercase tracking-widest shadow-lg shadow-indigo-900/20"
      >
        {loading ? 'EXECUTING ASSETS...' : 'EXECUTE PRODUCTION'}
      </button>

      {(resultText || loading) && (
        <div className="space-y-4 pt-2 border-t border-slate-800 animate-in fade-in slide-in-from-bottom-2">
          {loading && !resultText && (
            <div className="h-24 flex items-center justify-center border border-dashed border-slate-800 rounded-xl">
               <span className="text-[8px] font-black uppercase tracking-widest text-slate-700 animate-pulse">Initializing Neural Engine...</span>
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
                     className="w-full bg-black/40 border border-slate-800 rounded-lg px-3 py-2 text-[10px] text-indigo-300 outline-none focus:border-indigo-500 transition-all resize-none font-mono min-h-[38px]"
                   />
                 </div>
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
