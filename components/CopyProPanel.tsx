/**
 * CopyProPanel Component
 * 
 * Control panel for CopyPro settings: Platform, Mode, Tone, and Format selection.
 * Platform doctrine is applied FIRST, then CopyPro.
 */

import React from 'react';
import { Loader2, Sparkles, PenLine, Search, Crosshair, Linkedin, Youtube, Instagram, Twitter } from 'lucide-react';
import {
  CopyProConfig,
  CopyProMode,
  CopyProTone,
  CopyProFormat,
  Platform,
  MODE_LABELS,
  TONE_LABELS,
  FORMAT_LABELS,
  PLATFORM_LABELS
} from '../prompts/copyPro';

interface CopyProPanelProps {
  config: CopyProConfig;
  onConfigChange: (config: CopyProConfig) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  disabled?: boolean;
  showFormatSelector?: boolean;
  showPlatformSelector?: boolean;
}

// Mode icons
const getModeIcon = (mode: CopyProMode) => {
  switch (mode) {
    case 'write': return PenLine;
    case 'ideate': return Sparkles;
    case 'diagnose': return Search;
    default: return PenLine;
  }
};

// Platform icons
const getPlatformIcon = (platform: Platform) => {
  switch (platform) {
    case 'linkedin': return Linkedin;
    case 'youtube': return Youtube;
    case 'instagram': return Instagram;
    case 'twitter': return Twitter;
    default: return Linkedin;
  }
};

// Platform colors
const getPlatformColor = (platform: Platform, isSelected: boolean) => {
  if (!isSelected) return 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600';
  
  switch (platform) {
    case 'linkedin': return 'border-[#0077B5] bg-[#0077B5]/10 text-[#0077B5]';
    case 'youtube': return 'border-red-500 bg-red-500/10 text-red-400';
    case 'instagram': return 'border-pink-500 bg-pink-500/10 text-pink-400';
    case 'twitter': return 'border-sky-500 bg-sky-500/10 text-sky-400';
    default: return 'border-blue-500 bg-blue-500/10 text-blue-400';
  }
};

export const CopyProPanel: React.FC<CopyProPanelProps> = ({
  config,
  onConfigChange,
  onGenerate,
  isGenerating,
  disabled = false,
  showFormatSelector = true,
  showPlatformSelector = true
}) => {
  const handlePlatformChange = (platform: Platform) => {
    onConfigChange({ ...config, platform });
  };

  const handleModeChange = (mode: CopyProMode) => {
    onConfigChange({ ...config, mode });
  };

  const handleToneChange = (tone: CopyProTone) => {
    onConfigChange({ ...config, tone });
  };

  const handleFormatChange = (format: CopyProFormat) => {
    onConfigChange({ ...config, format });
  };

  const platforms: Platform[] = ['linkedin', 'youtube', 'instagram', 'twitter'];
  const modes: CopyProMode[] = ['write', 'ideate', 'diagnose'];
  const tones: CopyProTone[] = ['market-timing', 'tension-first', 'operator-reframe', 'myth-reality'];
  const formats: CopyProFormat[] = ['post', 'article', 'carousel', 'video-script', 'ic-memo'];

  return (
    <div className="space-y-4">
      {/* Platform Selector */}
      {showPlatformSelector && (
        <div className="space-y-2">
          <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
            Platform Doctrine
          </label>
          <div className="grid grid-cols-4 gap-2">
            {platforms.map(platform => {
              const Icon = getPlatformIcon(platform);
              const isSelected = config.platform === platform;
              return (
                <button
                  key={platform}
                  onClick={() => handlePlatformChange(platform)}
                  disabled={disabled}
                  className={`p-2 rounded-lg border text-center transition-all disabled:opacity-50 ${getPlatformColor(platform, isSelected)}`}
                >
                  <Icon size={18} className="mx-auto mb-1" />
                  <div className="text-[9px] font-bold uppercase tracking-wider">
                    {PLATFORM_LABELS[platform].label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode Selector */}
      <div className="space-y-2">
        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
          Output Mode
        </label>
        <div className="grid grid-cols-3 gap-2">
          {modes.map(mode => {
            const Icon = getModeIcon(mode);
            const isSelected = config.mode === mode;
            return (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                disabled={disabled}
                className={`p-3 rounded-lg border text-center transition-all disabled:opacity-50 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                }`}
              >
                <Icon size={16} className="mx-auto mb-1.5" />
                <div className="text-[10px] font-bold uppercase tracking-wider">
                  {MODE_LABELS[mode].label}
                </div>
                <div className="text-[8px] text-slate-500 mt-0.5 line-clamp-1">
                  {MODE_LABELS[mode].description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tone Selector */}
      <div className="space-y-2">
        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
          Tone
        </label>
        <div className="grid grid-cols-2 gap-2">
          {tones.map(tone => {
            const isSelected = config.tone === tone;
            return (
              <button
                key={tone}
                onClick={() => handleToneChange(tone)}
                disabled={disabled}
                className={`p-2.5 rounded-lg border text-left transition-all disabled:opacity-50 ${
                  isSelected
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <div className={`text-[10px] font-bold uppercase tracking-wider ${
                  isSelected ? 'text-purple-400' : 'text-slate-400'
                }`}>
                  {TONE_LABELS[tone].label}
                </div>
                <div className="text-[8px] text-slate-500 mt-0.5 line-clamp-2">
                  {TONE_LABELS[tone].description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Format Selector */}
      {showFormatSelector && config.mode === 'write' && (
        <div className="space-y-2">
          <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
            Output Format
          </label>
          <div className="flex flex-wrap gap-2">
            {formats.map(format => {
              const isSelected = config.format === format;
              return (
                <button
                  key={format}
                  onClick={() => handleFormatChange(format)}
                  disabled={disabled}
                  className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500 border border-transparent hover:text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {FORMAT_LABELS[format].label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={disabled || isGenerating}
        className={`w-full h-12 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
          isGenerating
            ? 'bg-amber-500/10 border-2 border-amber-500 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] animate-pulse'
            : disabled
              ? 'bg-slate-800 text-slate-600 border-2 border-transparent cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-2 border-transparent shadow-lg hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]'
        }`}
      >
        {isGenerating ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {config.mode === 'write' && 'Generating...'}
            {config.mode === 'ideate' && 'Ideating...'}
            {config.mode === 'diagnose' && 'Diagnosing...'}
          </>
        ) : (
          <>
            <Crosshair size={16} />
            {config.mode === 'write' && `Generate for ${PLATFORM_LABELS[config.platform].label}`}
            {config.mode === 'ideate' && 'Ideate with CopyPro'}
            {config.mode === 'diagnose' && 'Diagnose Content'}
          </>
        )}
      </button>

      {/* CopyPro + Platform Badge */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-600">
          {PLATFORM_LABELS[config.platform].label} Doctrine + CopyPro
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
      </div>
    </div>
  );
};

export default CopyProPanel;
