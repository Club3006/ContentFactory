/**
 * SourceInput Component
 * 
 * Multi-source input for CopyPro. Handles URLs, PDFs, text files, and manual notes.
 * Provides visual feedback for source processing status.
 */

import React, { useState, useCallback, useRef } from 'react';
import { 
  Link, 
  FileText, 
  Youtube, 
  PenLine, 
  X, 
  Plus, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Upload,
  Zap,
  Sparkles
} from 'lucide-react';
import { SourceMaterial } from '../prompts/sourcePackBuilder';

interface SourceInputProps {
  sources: SourceMaterial[];
  onSourcesChange: (sources: SourceMaterial[]) => void;
  onIngestAndBuild: () => void;
  onSynthesize: () => void;
  isIngesting: boolean;
  isReady: boolean;
  isSynthesizing: boolean;
  canSynthesize?: boolean; // true when content type is selected
}

// Generate unique IDs
let idCounter = 0;
const generateId = () => `source-${Date.now()}-${++idCounter}`;

// Detect source type from URL
const detectSourceType = (url: string): SourceMaterial['type'] => {
  if (/youtube\.com|youtu\.be|vimeo\.com/.test(url)) return 'video';
  return 'url';
};

// Get icon for source type
const SourceIcon: React.FC<{ type: SourceMaterial['type']; className?: string }> = ({ type, className }) => {
  switch (type) {
    case 'url': return <Link size={14} className={className} />;
    case 'video': return <Youtube size={14} className={className} />;
    case 'pdf': 
    case 'file': return <FileText size={14} className={className} />;
    case 'text': return <PenLine size={14} className={className} />;
    default: return <FileText size={14} className={className} />;
  }
};

// Status indicator component
const StatusIndicator: React.FC<{ status: SourceMaterial['status'] }> = ({ status }) => {
  switch (status) {
    case 'pending':
      return <span className="text-[8px] font-bold uppercase text-slate-500">Pending</span>;
    case 'processing':
      return (
        <span className="text-[8px] font-bold uppercase text-amber-400 flex items-center gap-1">
          <Loader2 size={10} className="animate-spin" />
          Processing
        </span>
      );
    case 'ready':
      return (
        <span className="text-[8px] font-bold uppercase text-emerald-400 flex items-center gap-1">
          <CheckCircle size={10} />
          Ready
        </span>
      );
    case 'error':
      return (
        <span className="text-[8px] font-bold uppercase text-red-400 flex items-center gap-1">
          <AlertCircle size={10} />
          Error
        </span>
      );
    default:
      return null;
  }
};

// Orbital-style Button Component
interface OrbitalButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant: 'default' | 'ingesting' | 'ready' | 'synthesizing';
  children: React.ReactNode;
  className?: string;
}

const OrbitalButton: React.FC<OrbitalButtonProps> = ({ onClick, disabled, variant, children, className = '' }) => {
  const baseStyles = "w-full h-12 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-2";
  
  const variantStyles = {
    default: "bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200 hover:border-slate-500",
    ingesting: "bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.3)] animate-pulse",
    ready: "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]",
    synthesizing: "bg-violet-500/10 border-violet-500 text-violet-400 shadow-[0_0_30px_rgba(139,92,246,0.3)] animate-pulse"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${disabled ? 'opacity-30 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

export const SourceInput: React.FC<SourceInputProps> = ({
  sources,
  onSourcesChange,
  onIngestAndBuild,
  onSynthesize,
  isIngesting,
  isReady,
  isSynthesizing,
  canSynthesize = true // Default true for backward compat
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [notesInput, setNotesInput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add URL source
  const handleAddUrl = useCallback(() => {
    if (!urlInput.trim()) return;
    
    const newSource: SourceMaterial = {
      id: generateId(),
      type: detectSourceType(urlInput),
      content: '',
      source: urlInput.trim(),
      status: 'pending'
    };
    
    onSourcesChange([...sources, newSource]);
    setUrlInput('');
  }, [urlInput, sources, onSourcesChange]);

  // Add notes as source
  const handleAddNotes = useCallback(() => {
    if (!notesInput.trim()) return;
    
    const newSource: SourceMaterial = {
      id: generateId(),
      type: 'text',
      content: notesInput.trim(),
      source: `Notes: ${notesInput.slice(0, 30)}...`,
      status: 'ready' // Text is already "ingested"
    };
    
    onSourcesChange([...sources, newSource]);
    setNotesInput('');
    setShowNotes(false);
  }, [notesInput, sources, onSourcesChange]);

  // Handle file upload
  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      const isPdf = file.type === 'application/pdf';
      const isTextFile = file.name.endsWith('.txt') || file.name.endsWith('.md');
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const newSource: SourceMaterial = {
          id: generateId(),
          type: isPdf ? 'pdf' : 'file',
          content,
          source: file.name,
          // PDFs need processing via Gemini Vision, text files are ready immediately
          status: isPdf ? 'pending' : 'ready'
        };
        onSourcesChange(prev => [...prev, newSource]);
      };

      if (isPdf) {
        // Read PDFs as base64 data URL for Gemini Vision API
        reader.readAsDataURL(file);
      } else {
        // Read text files as plain text
        reader.readAsText(file);
      }
    });
  }, [onSourcesChange]);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  // Remove source
  const handleRemove = useCallback((id: string) => {
    onSourcesChange(sources.filter(s => s.id !== id));
  }, [sources, onSourcesChange]);

  // Count ready sources
  const readyCount = sources.filter(s => s.status === 'ready').length;
  const hasAnySources = sources.length > 0;
  const hasPendingSources = sources.some(s => s.status === 'pending');

  return (
    <div className="space-y-3">
      {/* URL Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
            placeholder="Paste URL (article, YouTube, blog...)"
            className="w-full h-10 bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>
        <button
          onClick={handleAddUrl}
          disabled={!urlInput.trim()}
          className="px-4 h-10 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1"
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      {/* File Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
          isDragOver 
            ? 'border-amber-500 bg-amber-500/10' 
            : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,.doc,.docx"
          multiple
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
        />
        <Upload size={20} className={`mx-auto mb-2 ${isDragOver ? 'text-amber-400' : 'text-slate-500'}`} />
        <p className={`text-[10px] font-bold uppercase tracking-wider ${isDragOver ? 'text-amber-400' : 'text-slate-500'}`}>
          {isDragOver ? 'Drop files here' : 'Drop PDFs, TXT, or click to upload'}
        </p>
      </div>

      {/* Manual Notes / Paste Content */}
      {!showNotes ? (
        <button
          onClick={() => setShowNotes(true)}
          className="w-full h-10 border border-dashed border-slate-700 hover:border-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-400 transition-colors flex items-center justify-center gap-2"
        >
          <PenLine size={12} />
          Add Manual Notes
        </button>
      ) : (
        <div className="space-y-2">
          <textarea
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            placeholder="Type or paste your notes, quotes, transcripts, or any text content..."
            className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setShowNotes(false); setNotesInput(''); }}
              className="flex-1 h-8 border border-slate-700 hover:border-slate-600 rounded text-[10px] font-bold uppercase text-slate-500 hover:text-slate-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddNotes}
              disabled={!notesInput.trim()}
              className="flex-1 h-8 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 disabled:opacity-30 rounded text-[10px] font-bold uppercase text-slate-300 transition-colors"
            >
              Add Notes
            </button>
          </div>
        </div>
      )}

      {/* Sources List */}
      {sources.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
              Sources ({sources.length})
            </span>
            <span className="text-[9px] text-slate-600">
              {readyCount}/{sources.length} ready
            </span>
          </div>
          
          <div className="space-y-1.5">
            {sources.map(source => (
              <div
                key={source.id}
                className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                  source.status === 'ready' 
                    ? 'border-emerald-500/30 bg-emerald-500/5' 
                    : source.status === 'processing'
                      ? 'border-amber-500/30 bg-amber-500/5 animate-pulse'
                      : source.status === 'error'
                        ? 'border-red-500/30 bg-red-500/5'
                        : 'border-slate-700 bg-slate-800/50'
                }`}
              >
                <SourceIcon type={source.type} className="text-slate-400 shrink-0" />
                <span className="flex-1 text-xs text-slate-300 truncate">
                  {source.source}
                </span>
                <StatusIndicator status={source.status} />
                <button
                  onClick={() => handleRemove(source.id)}
                  className="p-1 text-slate-500 hover:text-red-400 transition-colors shrink-0"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multi-Modal Action Button */}
      {hasAnySources && (
        <div className="pt-2">
          {!isReady ? (
            // INGEST SOURCES state
            <OrbitalButton
              onClick={onIngestAndBuild}
              disabled={isIngesting || (!hasPendingSources && readyCount === 0)}
              variant={isIngesting ? 'ingesting' : 'default'}
            >
              {isIngesting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Ingesting Sources...
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Ingest Sources
                </>
              )}
            </OrbitalButton>
          ) : (
            // SYNTHESIZE CONTENT state - only enabled when canSynthesize is true
            <OrbitalButton
              onClick={onSynthesize}
              disabled={isSynthesizing || !canSynthesize}
              variant={isSynthesizing ? 'synthesizing' : 'ready'}
            >
              {isSynthesizing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Synthesizing...
                </>
              ) : !canSynthesize ? (
                <>
                  <Sparkles size={16} />
                  Select Content Type Below
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Synthesize Content
                </>
              )}
            </OrbitalButton>
          )}
        </div>
      )}
    </div>
  );
};

export default SourceInput;
