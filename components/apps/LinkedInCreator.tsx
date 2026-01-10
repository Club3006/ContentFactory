/**
 * LinkedInCreator - CopyPro-Powered LinkedIn Content Generator
 * 
 * Integrates the CopyPro institutional-grade copywriting engine for generating
 * LinkedIn posts, articles, carousels, and video scripts.
 */

import React, { useState, useCallback } from 'react';
import { Loader2, Save, CheckCircle, AlertTriangle, FileText, Newspaper, Layers, Video, Copy, X, Check, RefreshCw } from 'lucide-react';
import { LinkedInContent, LinkedInContentType } from '../../types';
import { db } from '../../db/db';
import { SourceMaterial, SourcePack, createEmptySourcePack } from '../../prompts/sourcePackBuilder';
import { CopyProConfig, CopyProFormat } from '../../prompts/copyPro';
import { 
  ingestAllSources, 
  buildSourcePack, 
  generateContent, 
  refineContent,
  CopyProOutput,
  getQualityBadge
} from '../../services/copyProService';
import { SourceInput } from '../SourceInput';
import { OutputRating } from '../OutputRating';

interface Props {
  onClose: () => void;
  initialTranscript?: string;
  initialData?: LinkedInContent;
  onSaved?: () => void;
}

// Content type configuration
interface ContentTypeOption {
  type: CopyProFormat;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const contentTypes: ContentTypeOption[] = [
  { type: 'post', label: 'Post', icon: <FileText size={16} />, description: 'Standard LinkedIn post (150-300 words)' },
  { type: 'article', label: 'Article', icon: <Newspaper size={16} />, description: 'Long-form LinkedIn article (800+ words)' },
  { type: 'carousel', label: 'Carousel', icon: <Layers size={16} />, description: 'Script for carousel slides (Canva)' },
  { type: 'video-script', label: 'Video Script', icon: <Video size={16} />, description: 'Script for video content' }
];

// Map CopyPro format to LinkedIn content type
const formatToContentType = (format: CopyProFormat): LinkedInContentType => {
  switch (format) {
    case 'post': return 'post';
    case 'article': return 'article';
    case 'carousel': return 'carousel';
    case 'video-script': return 'script';
    default: return 'post';
  }
};

export const LinkedInCreator: React.FC<Props> = ({ 
  onClose, 
  initialTranscript = '', 
  initialData, 
  onSaved 
}) => {
  // Draft tracking
  const [draftId, setDraftId] = useState<number | undefined>(initialData?.id);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sources state
  const [sources, setSources] = useState<SourceMaterial[]>(() => {
    if (initialTranscript) {
      return [{
        id: 'initial-transcript',
        type: 'text',
        content: initialTranscript,
        source: 'Initial Transcript',
        status: 'ready'
      }];
    }
    return [];
  });

  // SourcePack state
  const [sourcePack, setSourcePack] = useState<SourcePack>(createEmptySourcePack());
  const [isIngesting, setIsIngesting] = useState(false);
  const [sourcePackReady, setSourcePackReady] = useState(false);

  // Content type selection - null means not yet selected
  const [selectedFormat, setSelectedFormat] = useState<CopyProFormat | null>(null);
  
  // Output modal state
  const [showOutputModal, setShowOutputModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // CopyPro config
  const [config, setConfig] = useState<CopyProConfig>({
    mode: 'write',
    tone: 'market-timing',
    format: 'post',
    platform: 'linkedin'
  });

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [output, setOutput] = useState<CopyProOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle source changes
  const handleSourcesChange = useCallback((newSources: SourceMaterial[]) => {
    setSources(newSources);
    if (sourcePackReady) {
      setSourcePackReady(false);
      setSourcePack(createEmptySourcePack());
    }
  }, [sourcePackReady]);

  // Ingest sources and build SourcePack
  const handleIngestAndBuild = useCallback(async () => {
    setIsIngesting(true);
    setError(null);

    try {
      const ingestedSources = await ingestAllSources(sources, (id, status) => {
        setSources(prev => prev.map(s => 
          s.id === id ? { ...s, status } : s
        ));
      });

      setSources(ingestedSources);
      const pack = await buildSourcePack(ingestedSources);
      setSourcePack(pack);
      setSourcePackReady(true);
    } catch (err) {
      setError(`Failed to ingest sources: ${(err as Error).message}`);
    } finally {
      setIsIngesting(false);
    }
  }, [sources]);

  // Synthesize content
  const handleSynthesize = useCallback(async () => {
    if (!sourcePackReady) {
      setError('Please ingest sources first.');
      return;
    }
    
    if (!selectedFormat) {
      setError('Please select a content type first.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setOutput(null);

    try {
      const updatedConfig = { ...config, format: selectedFormat };
      const result = await generateContent(sourcePack, updatedConfig);
      setOutput(result);
      setShowOutputModal(true); // Open the output modal
    } catch (err) {
      setError(`Generation failed: ${(err as Error).message}`);
    } finally {
      setIsGenerating(false);
    }
  }, [sourcePack, config, selectedFormat, sourcePackReady]);
  
  // Copy content to clipboard
  const handleCopyContent = useCallback(() => {
    if (output?.content) {
      navigator.clipboard.writeText(output.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [output]);

  // Refine output based on feedback
  const handleRefine = useCallback(async (rating: number, feedback: string) => {
    if (!output) return;

    setIsRefining(true);
    setError(null);

    try {
      const result = await refineContent({
        previousOutput: output.content,
        rating,
        feedback,
        sourcePack: output.sourcePack,
        config: output.config,
        iteration: output.iteration
      });
      setOutput(result);
    } catch (err) {
      setError(`Refinement failed: ${(err as Error).message}`);
    } finally {
      setIsRefining(false);
    }
  }, [output]);

  // Save content to database
  const saveContent = useCallback(async (isPublished: boolean = false) => {
    if (!output?.content || !selectedFormat) return;

    setIsSaving(true);
    try {
      const contentData: Omit<LinkedInContent, 'id'> = {
        title: output.content.substring(0, 60) || 'Untitled',
        contentBody: output.content,
        contentType: formatToContentType(selectedFormat as CopyProFormat),
        platform: 'linkedin',
        isPublished,
        publishedAt: isPublished ? Date.now() : undefined,
        createdAt: draftId ? (initialData?.createdAt || Date.now()) : Date.now(),
        updatedAt: Date.now()
      };

      if (draftId) {
        await db.linkedInContent.update(draftId, contentData);
      } else {
        const newId = await db.linkedInContent.add(contentData as LinkedInContent);
        setDraftId(newId as number);
      }

      setLastSaved(new Date());
      onSaved?.();
    } catch (e) {
      console.error('Failed to save content:', e);
      setError('Failed to save content.');
    } finally {
      setIsSaving(false);
    }
  }, [output, selectedFormat, draftId, initialData, onSaved]);

  // Quality badge for SourcePack
  const qualityBadge = getQualityBadge(sourcePack.quality);

  return (
    <div className="flex flex-col h-full bg-slate-900 font-mono text-slate-200">
      {/* Save Status Bar */}
      <div className="px-6 py-2 border-b border-white/5 flex items-center justify-between text-[9px] text-slate-500 shrink-0">
        <div className="flex items-center gap-2">
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
            <span className="text-slate-600">Not saved</span>
          )}
        </div>
        <button
          onClick={() => saveContent(false)}
          disabled={isSaving || !output?.content}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Save size={10} />
          Save Draft
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-grow p-6 overflow-y-auto space-y-6 custom-scrollbar">
        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs flex items-center gap-2">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {/* Source Input Section */}
        <div className="space-y-2">
          <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
            Source Materials
          </label>
          <SourceInput
            sources={sources}
            onSourcesChange={handleSourcesChange}
            onIngestAndBuild={handleIngestAndBuild}
            onSynthesize={handleSynthesize}
            isIngesting={isIngesting}
            isReady={sourcePackReady}
            isSynthesizing={isGenerating}
            canSynthesize={!!selectedFormat}
          />
        </div>

        {/* Content Type Selector - Show after sources are ready */}
        {sourcePackReady && !showOutputModal && (
          <div className="space-y-3 p-4 rounded-lg border-2 border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                ↓ Select Content Type to Synthesize
              </label>
              {!selectedFormat && (
                <span className="text-[9px] text-amber-400/70 animate-pulse">Required</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {contentTypes.map((ct) => (
                <button
                  key={ct.type}
                  onClick={() => setSelectedFormat(ct.type)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedFormat === ct.type
                      ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                      : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={selectedFormat === ct.type ? 'text-amber-400' : 'text-slate-400'}>
                      {ct.icon}
                    </span>
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${
                      selectedFormat === ct.type ? 'text-amber-400' : 'text-slate-300'
                    }`}>
                      {ct.label}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500">{ct.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SourcePack Quality Indicator */}
        {sourcePackReady && !showOutputModal && (
          <div className={`p-3 rounded-lg border ${qualityBadge.border} ${qualityBadge.bg}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${qualityBadge.text}`}>
                SourcePack Quality: {sourcePack.quality.toUpperCase()}
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

        {/* Generating indicator when in progress */}
        {isGenerating && (
          <div className="flex items-center justify-center p-8 border-2 border-violet-500/30 bg-violet-500/5 rounded-lg">
            <div className="text-center space-y-3">
              <Loader2 size={32} className="animate-spin text-violet-400 mx-auto" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-violet-400">
                Synthesizing {selectedFormat} content...
              </p>
              <p className="text-[9px] text-slate-500">
                CopyPro is analyzing your sources and crafting your content
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Output Modal */}
      {showOutputModal && output && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle size={16} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Generated {selectedFormat?.toUpperCase()} Content
                  </h3>
                  <p className="text-[9px] text-slate-500">
                    Iteration {output.iteration} • {output.validation?.length || 0} validation checks
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOutputModal(false)}
                className="p-2 text-slate-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
              {/* Copy Button */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleCopyContent}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    copied
                      ? 'bg-emerald-500/10 border border-emerald-500 text-emerald-400'
                      : 'bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 text-slate-300'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check size={14} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copy to Clipboard
                    </>
                  )}
                </button>
              </div>
              
              {/* Generated Content */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <pre className="whitespace-pre-wrap text-sm text-white/90 font-sans leading-relaxed select-text cursor-text">
                  {output.content}
                </pre>
              </div>
              
              {/* Rating & Refinement */}
              <div className="mt-6">
                <OutputRating
                  content={output.content}
                  validation={output.validation}
                  iteration={output.iteration}
                  onRefine={handleRefine}
                  isRefining={isRefining}
                  format={selectedFormat || 'post'}
                  platform="linkedin"
                  contentType="linkedin"
                  sourcePackSummary={sourcePack.qualityNotes || `${sourcePack.verifiedFacts?.length || 0} facts, ${sourcePack.quotes?.length || 0} quotes`}
                />
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/10 shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={() => handleRefine(3, 'Generate a completely different approach with new structure and angle')}
                  disabled={isRefining}
                  className="flex-1 h-10 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/50 hover:border-amber-500 text-amber-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isRefining ? 'animate-spin' : ''} />
                  Regenerate
                </button>
                <button
                  onClick={() => saveContent(false)}
                  disabled={isSaving}
                  className="flex-1 h-10 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save size={14} />
                  Save Draft
                </button>
                <button
                  onClick={() => saveContent(true)}
                  disabled={isSaving}
                  className="flex-1 h-10 bg-emerald-500/10 hover:bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle size={14} />
                  Save & Publish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkedInCreator;
