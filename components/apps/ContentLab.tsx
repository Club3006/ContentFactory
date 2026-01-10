/**
 * ContentLab (Generator) - Multi-mode Content Generation
 * 
 * Supports two modes:
 * - Standard Mode: Quick synthesis from seed quote + URLs
 * - CopyPro Mode: Institutional-grade content with SourcePack and iteration
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { rewriteContent, generateVisual, refineContent as refineContentBasic, refineVisual, synthesizeContent } from '../../services/geminiService';
import { UserPersona, GeneratorDraft } from '../../types';
import { dbService } from '../../services/dbService';
import { db } from '../../db/db';
import { handleShiftEnter } from '../../utils/eventUtils';
import { fetchTranscript } from '../../services/apifyService';
import { Link, X, Plus, Loader2, Save, CheckCircle, Zap, Award } from 'lucide-react';

// CopyPro imports
import { SourceMaterial, SourcePack, createEmptySourcePack } from '../../prompts/sourcePackBuilder';
import { CopyProConfig } from '../../prompts/copyPro';
import { 
  ingestAllSources, 
  buildSourcePack, 
  generateContent as generateCopyProContent, 
  refineContent as refineCopyProContent,
  CopyProOutput,
  getQualityBadge
} from '../../services/copyProService';
import { SourceInput } from '../SourceInput';
import { CopyProPanel } from '../CopyProPanel';
import { OutputRating } from '../OutputRating';

interface ContextSource {
  id: string;
  url: string;
  status: 'pending' | 'processing' | 'ready' | 'error';
  content?: string;
  error?: string;
}

interface Props {
  initialData?: GeneratorDraft;
}

type GeneratorMode = 'standard' | 'copypro';

const ContentLab: React.FC<Props> = ({ initialData }) => {
  // Mode toggle
  const [mode, setMode] = useState<GeneratorMode>('standard');

  // Draft tracking
  const [draftId, setDraftId] = useState<number | undefined>(initialData?.id);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  
  // ================== STANDARD MODE STATE ==================
  const [seedQuote, setSeedQuote] = useState(initialData?.seedQuote || '');
  const [sources, setSources] = useState<ContextSource[]>(() => {
    if (initialData?.contextSources) {
      return initialData.contextSources.map((url, i) => ({
        id: `${Date.now()}-${i}`,
        url,
        status: 'pending' as const
      }));
    }
    return [];
  });
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [targetPlatform, setTargetPlatform] = useState(initialData?.platform || 'LinkedIn');
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16">("1:1");
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState(initialData?.generatedContent || '');
  const [resultImage, setResultImage] = useState('');
  const [refineInput, setRefineInput] = useState('');
  const [refining, setRefining] = useState(false);
  const [activePersona, setActivePersona] = useState<UserPersona | null>(null);

  // ================== COPYPRO MODE STATE ==================
  const [copyProSources, setCopyProSources] = useState<SourceMaterial[]>([]);
  const [sourcePack, setSourcePack] = useState<SourcePack>(createEmptySourcePack());
  const [isBuildingPack, setIsBuildingPack] = useState(false);
  const [sourcePackReady, setSourcePackReady] = useState(false);
  const [copyProConfig, setCopyProConfig] = useState<CopyProConfig>({
    mode: 'write',
    tone: 'market-timing',
    format: 'post',
    platform: 'linkedin'
  });
  const [isGeneratingCopyPro, setIsGeneratingCopyPro] = useState(false);
  const [isRefiningCopyPro, setIsRefiningCopyPro] = useState(false);
  const [copyProOutput, setCopyProOutput] = useState<CopyProOutput | null>(null);
  const [copyProError, setCopyProError] = useState<string | null>(null);

  const originalImagePrompt = useRef('');
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const savedPersonas = localStorage.getItem('retro_personas');
    const activeId = localStorage.getItem('active_persona_id');
    if (savedPersonas) {
      const parsed = JSON.parse(savedPersonas);
      const active = parsed.find((p: UserPersona) => p.id === activeId) || parsed[0];
      setActivePersona(active);
    }
  }, []);

  // ================== SAVE LOGIC ==================
  const saveDraft = useCallback(async (status: 'draft' | 'final' = 'draft') => {
    const contentToSave = mode === 'copypro' ? copyProOutput?.content : resultText;
    if (!seedQuote.trim() && !contentToSave) return;
    
    setIsSaving(true);
    try {
      const draftData: Omit<GeneratorDraft, 'id'> = {
        title: seedQuote.substring(0, 50) || 'Untitled Draft',
        seedQuote: mode === 'copypro' ? '' : seedQuote,
        contextSources: mode === 'copypro' 
          ? copyProSources.map(s => s.source) 
          : sources.map(s => s.url),
        platform: mode === 'copypro' ? copyProConfig.format : targetPlatform,
        generatedContent: contentToSave || '',
        status,
        createdAt: draftId ? (initialData?.createdAt || Date.now()) : Date.now(),
        updatedAt: Date.now()
      };

      if (draftId) {
        await db.generatorDrafts.update(draftId, draftData);
      } else {
        const newId = await db.generatorDrafts.add(draftData as GeneratorDraft);
        setDraftId(newId as number);
      }
      
      setLastSaved(new Date());
    } catch (e) {
      console.error('Failed to save draft:', e);
    } finally {
      setIsSaving(false);
    }
  }, [seedQuote, sources, copyProSources, targetPlatform, resultText, copyProOutput, copyProConfig, mode, draftId, initialData]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!autoSaveEnabled) return;
    
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    const hasContent = mode === 'copypro' 
      ? copyProOutput?.content 
      : (seedQuote.trim() || resultText);

    if (hasContent) {
      autoSaveTimer.current = setTimeout(() => {
        saveDraft('draft');
      }, 30000);
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [seedQuote, sources, copyProSources, targetPlatform, resultText, copyProOutput, autoSaveEnabled, saveDraft, mode]);

  // ================== STANDARD MODE HANDLERS ==================
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

  const handleRemoveSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
  };

  const ingestSource = async (source: ContextSource): Promise<ContextSource> => {
    try {
      const result = await fetchTranscript(source.url);
      return { ...source, status: 'ready', content: result.transcriptText };
    } catch (e) {
      return { ...source, status: 'error', error: e instanceof Error ? e.message : 'Unknown error' };
    }
  };

  const handleIngestAll = async () => {
    if (sources.length === 0) return;
    setIsIngesting(true);
    setSources(prev => prev.map(s => s.status === 'pending' ? { ...s, status: 'processing' as const } : s));

    const pendingSources = sources.filter(s => s.status === 'pending' || s.status === 'processing');
    for (const source of pendingSources) {
      setSources(prev => prev.map(s => s.id === source.id ? { ...s, status: 'processing' as const } : s));
      const result = await ingestSource(source);
      setSources(prev => prev.map(s => s.id === source.id ? result : s));
    }
    setIsIngesting(false);
  };

  const allSourcesReady = sources.length > 0 && sources.every(s => s.status === 'ready');
  const hasProcessingSources = sources.some(s => s.status === 'processing');

  const handleGenerate = async () => {
    if (!seedQuote.trim()) {
      alert("Please enter a seed quote.");
      return;
    }
    setLoading(true);
    setResultText('');
    setResultImage('');

    try {
      const contextTexts = sources.filter(s => s.status === 'ready' && s.content).map(s => s.content!).join('\n\n---\n\n');
      const synthesized = await synthesizeContent(seedQuote, contextTexts, targetPlatform, activePersona);
      setResultText(synthesized);

      if (activePersona?.branding) {
        originalImagePrompt.current = `A high-end visual for ${targetPlatform} using ${activePersona.branding} style. Subject: ${seedQuote.substring(0, 80)}. Aspect: ${aspectRatio}.`;
        const img = await generateVisual(originalImagePrompt.current, aspectRatio);
        setResultImage(img);
      }
      saveDraft('draft');
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
        metadata: { seedQuote, sourceCount: sources.length, imageUrl: resultImage, aspectRatio, personaId: activePersona?.id }
      });
      await saveDraft('final');
      alert("Content saved to Library!");
    } catch (e) {
      console.error("Save failed:", e);
      alert("Failed to save content.");
    }
  };

  const handleRefineStandard = async () => {
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
        const newText = await refineContentBasic(resultText, feedback, activePersona);
        setResultText(newText);
      }
    } catch (e) {
      console.error("Refinement error:", e);
    } finally {
      setRefining(false);
    }
  };

  // ================== COPYPRO MODE HANDLERS ==================
  const handleCopyProSourcesChange = useCallback((newSources: SourceMaterial[]) => {
    setCopyProSources(newSources);
    if (sourcePackReady) {
      setSourcePackReady(false);
      setSourcePack(createEmptySourcePack());
    }
  }, [sourcePackReady]);

  const handleBuildSourcePack = useCallback(async () => {
    setIsBuildingPack(true);
    setCopyProError(null);

    try {
      const ingestedSources = await ingestAllSources(copyProSources, (id, status) => {
        setCopyProSources(prev => prev.map(s => s.id === id ? { ...s, status } : s));
      });
      setCopyProSources(ingestedSources);

      const pack = await buildSourcePack(ingestedSources);
      setSourcePack(pack);
      setSourcePackReady(true);
    } catch (err) {
      setCopyProError(`Failed to build SourcePack: ${(err as Error).message}`);
    } finally {
      setIsBuildingPack(false);
    }
  }, [copyProSources]);

  const handleGenerateCopyPro = useCallback(async () => {
    if (!sourcePackReady) {
      setCopyProError('Please build a SourcePack first.');
      return;
    }
    setIsGeneratingCopyPro(true);
    setCopyProError(null);
    setCopyProOutput(null);

    try {
      const result = await generateCopyProContent(sourcePack, copyProConfig);
      setCopyProOutput(result);
    } catch (err) {
      setCopyProError(`Generation failed: ${(err as Error).message}`);
    } finally {
      setIsGeneratingCopyPro(false);
    }
  }, [sourcePack, copyProConfig, sourcePackReady]);

  const handleRefineCopyPro = useCallback(async (rating: number, feedback: string) => {
    if (!copyProOutput) return;
    setIsRefiningCopyPro(true);
    setCopyProError(null);

    try {
      const result = await refineCopyProContent({
        previousOutput: copyProOutput.content,
        rating,
        feedback,
        sourcePack: copyProOutput.sourcePack,
        config: copyProOutput.config,
        iteration: copyProOutput.iteration
      });
      setCopyProOutput(result);
    } catch (err) {
      setCopyProError(`Refinement failed: ${(err as Error).message}`);
    } finally {
      setIsRefiningCopyPro(false);
    }
  }, [copyProOutput]);

  const qualityBadge = getQualityBadge(sourcePack.quality);

  return (
    <div className="space-y-4 font-mono h-full overflow-y-auto p-4">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg">
          <button
            onClick={() => setMode('standard')}
            className={`px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              mode === 'standard'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Zap size={12} />
            Standard
          </button>
          <button
            onClick={() => setMode('copypro')}
            className={`px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              mode === 'copypro'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Award size={12} />
            CopyPro
          </button>
        </div>

        {/* Save Status */}
        <div className="flex items-center gap-2 text-[9px] text-slate-500">
          {isSaving ? (
            <>
              <Loader2 size={10} className="animate-spin" />
              <span>Saving...</span>
            </>
          ) : lastSaved ? (
            <>
              <CheckCircle size={10} className="text-emerald-500" />
              <span>Saved {lastSaved.toLocaleTimeString()}</span>
            </>
          ) : (
            <span className="text-slate-600">Auto-save on</span>
          )}
          <button
            onClick={() => saveDraft('draft')}
            disabled={isSaving}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <Save size={10} />
            Save
          </button>
        </div>
      </div>

      {/* ================== STANDARD MODE ================== */}
      {mode === 'standard' && (
        <>
          <div className="flex flex-col gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Active Identity</label>
              <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-[10px] text-blue-400 font-black uppercase">
                {activePersona ? activePersona.name : 'No Identity Selected'}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Seed Quote</label>
              <textarea
                value={seedQuote}
                onChange={(e) => setSeedQuote(e.target.value)}
                placeholder="Paste your notable quote here..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-xs text-slate-200 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600 resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Context Sources</label>
              <div className="space-y-2">
                {sources.map(source => (
                  <div key={source.id} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${getSourceBorderClass(source.status)} ${source.status === 'processing' ? 'animate-pulse' : ''}`}>
                    <Link size={14} className="text-slate-500 shrink-0" />
                    <span className="flex-1 text-xs text-slate-300 truncate">{source.url}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider shrink-0 ${source.status === 'ready' ? 'text-emerald-400' : source.status === 'processing' ? 'text-yellow-400' : source.status === 'error' ? 'text-red-400' : 'text-slate-500'}`}>
                      {source.status === 'ready' && 'Ready ✓'}
                      {source.status === 'processing' && 'Processing...'}
                      {source.status === 'error' && 'Failed'}
                      {source.status === 'pending' && 'Pending'}
                    </span>
                    <button onClick={() => handleRemoveSource(source.id)} className="text-slate-600 hover:text-red-400 transition-colors shrink-0"><X size={14} /></button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  placeholder="Paste URL..."
                  className="flex-1 bg-slate-900 border border-slate-700 p-2 rounded-lg text-xs text-slate-200 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSource()}
                />
                <button onClick={handleAddSource} disabled={!newSourceUrl.trim()} className="bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1">
                  <Plus size={12} /> Add
                </button>
              </div>

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
                  {isIngesting || hasProcessingSources ? (<><Loader2 size={14} className="animate-spin" /> PROCESSING...</>) : allSourcesReady ? 'ALL SOURCES READY ✓' : 'INGEST ALL SOURCES'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Channel</label>
                <select value={targetPlatform} onChange={(e) => setTargetPlatform(e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-xs text-slate-200 outline-none">
                  <option>LinkedIn</option>
                  <option>YouTube</option>
                  <option>Instagram</option>
                  <option>Twitter/X</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Ratio</label>
                <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as any)} className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-xs text-slate-200 outline-none">
                  <option value="1:1">1:1 Square</option>
                  <option value="16:9">16:9 Landscape</option>
                  <option value="9:16">9:16 Portrait</option>
                </select>
              </div>
            </div>
          </div>

          <button onClick={handleGenerate} disabled={loading || !seedQuote.trim()} className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white font-black rounded-lg text-[10px] transition-all uppercase tracking-widest shadow-lg shadow-indigo-900/20">
            {loading ? 'SYNTHESIZING CONTENT...' : 'EXECUTE PRODUCTION'}
          </button>

          {(resultText || loading) && (
            <div className="space-y-4 pt-2 border-t border-slate-800 animate-in fade-in slide-in-from-bottom-2">
              {loading && !resultText && (
                <div className="h-24 flex items-center justify-center border border-dashed border-slate-800 rounded-xl">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-700 animate-pulse">Synthesizing Content...</span>
                </div>
              )}

              {resultText && (
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 relative group">
                  <div className="text-[10px] text-slate-300 leading-relaxed whitespace-pre-wrap mb-4 font-mono select-text cursor-text">{resultText}</div>
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Refine</span>
                      {refining && <div className="w-1 h-1 bg-indigo-400 rounded-full animate-pulse"></div>}
                    </div>
                    <textarea
                      value={refineInput}
                      onChange={(e) => setRefineInput(e.target.value)}
                      onKeyDown={(e) => handleShiftEnter(e, handleRefineStandard)}
                      disabled={refining}
                      rows={1}
                      placeholder="[ INSTRUCTIONS... ]"
                      className="w-full bg-transparent border border-transparent rounded-lg px-3 py-2 text-[10px] text-indigo-300 outline-none focus:border-emerald-500 focus:bg-emerald-500/30 transition-all resize-none font-mono min-h-[38px]"
                    />
                  </div>
                  <div className="mt-2 flex justify-end gap-2">
                    <button onClick={() => saveDraft('final')} className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/50 px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-widest transition-all">Save as Final</button>
                    <button onClick={handleSaveToLibrary} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/50 px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-widest transition-all">Save to Library</button>
                  </div>
                </div>
              )}

              {resultImage && (
                <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden relative group">
                  <img src={resultImage} alt="Visual Asset" className="w-full h-auto" />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={resultImage} download="asset_pro.png" className="bg-white/90 backdrop-blur-sm text-slate-900 px-2 py-1 rounded text-[8px] font-black uppercase hover:bg-white transition-colors">SAVE</a>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ================== COPYPRO MODE ================== */}
      {mode === 'copypro' && (
        <div className="space-y-4">
          {/* Error Display */}
          {copyProError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs">
              {copyProError}
            </div>
          )}

          {/* Source Input */}
          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Source Materials</label>
            <SourceInput
              sources={copyProSources}
              onSourcesChange={handleCopyProSourcesChange}
              onBuildSourcePack={handleBuildSourcePack}
              isBuilding={isBuildingPack}
              isReady={sourcePackReady}
            />
          </div>

          {/* SourcePack Quality */}
          {sourcePackReady && (
            <div className={`p-3 rounded-lg border ${qualityBadge.border} ${qualityBadge.bg}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${qualityBadge.text}`}>
                  SourcePack: {sourcePack.quality.toUpperCase()}
                </span>
                <span className="text-[9px] text-slate-500">
                  {sourcePack.verifiedFacts.length} facts • {sourcePack.quotes.length} quotes
                </span>
              </div>
              {sourcePack.qualityNotes && (
                <p className="text-[10px] text-slate-400 mt-1">{sourcePack.qualityNotes}</p>
              )}
            </div>
          )}

          {/* CopyPro Controls */}
          {sourcePackReady && !copyProOutput && (
            <CopyProPanel
              config={copyProConfig}
              onConfigChange={setCopyProConfig}
              onGenerate={handleGenerateCopyPro}
              isGenerating={isGeneratingCopyPro}
              disabled={!sourcePackReady}
            />
          )}

          {/* Output with Rating */}
          {copyProOutput && (
            <div className="space-y-4 pt-4 border-t border-white/5">
              <OutputRating
                content={copyProOutput.content}
                validation={copyProOutput.validation}
                iteration={copyProOutput.iteration}
                onRefine={handleRefineCopyPro}
                isRefining={isRefiningCopyPro}
              />

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => saveDraft('draft')}
                  disabled={isSaving}
                  className="flex-1 h-10 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save size={14} /> Save Draft
                </button>
                <button
                  onClick={() => saveDraft('final')}
                  disabled={isSaving}
                  className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle size={14} /> Save Final
                </button>
              </div>

              <button
                onClick={() => setCopyProOutput(null)}
                className="w-full h-8 text-slate-500 hover:text-slate-400 text-[9px] font-bold uppercase tracking-wider transition-colors"
              >
                ← Back to Settings
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContentLab;

