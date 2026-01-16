import React, { useState, useEffect } from 'react';
import { X, Upload, Star, Loader2 } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { RotaryKnob } from '../ui/RotaryKnob';
import { VaultItem, PersonaMix, CreatorAppInput } from '../../types';

interface InstagramCreatorProps {
  onClose: () => void;
  data?: any; // Window data that includes dropped items
}

const INSTAGRAM_FORMATS = [
  { id: 'post', label: 'Post' },
  { id: 'carousel', label: 'Carousel' },
  { id: 'video_script', label: 'Video (Script)' }
];

const AVAILABLE_PERSONAS = [
  { id: 'lo_fuhr', name: 'LO_Fuhr' },
  { id: 'tucker', name: 'Tucker Carlson' },
  { id: 'datanerd', name: 'DataNerd' },
  { id: 'storyteller', name: 'StoryTeller' }
];

export const InstagramCreator: React.FC<InstagramCreatorProps> = ({ onClose, data }) => {
  const [droppedCards, setDroppedCards] = useState<VaultItem[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string>('post');
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [personaMix, setPersonaMix] = useState<PersonaMix[]>([
    { id: 'lo_fuhr', name: 'LO_Fuhr', percentage: 80 },
    { id: 'slot2', name: 'SELECT', percentage: 10 },
    { id: 'slot3', name: 'SELECT', percentage: 10 }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
  const [iterationGuidance, setIterationGuidance] = useState('');

  // Drop zone for KanBan cards
  const { setNodeRef, isOver } = useDroppable({
    id: 'instagram-creator-drop-zone'
  });

  // Handle dropped items from window data
  useEffect(() => {
    if (data?.droppedItem && data?.timestamp) {
      const item = data.droppedItem as VaultItem;
      // Check if already added (by id and type)
      if (!droppedCards.find(c => c.id === item.id && c.type === item.type)) {
        setDroppedCards(prev => [...prev, item]);
      }
    }
  }, [data?.timestamp]); // Only react to timestamp changes

  const handleKnobChange = (index: number, newValue: number) => {
    const newMix = [...personaMix];
    const oldValue = newMix[index].percentage;
    const delta = newValue - oldValue;
    
    newMix[index].percentage = newValue;

    // Distribute the delta across other knobs
    const otherIndices = [0, 1, 2].filter(i => i !== index);
    const totalOther = otherIndices.reduce((sum, i) => sum + newMix[i].percentage, 0);
    
    if (totalOther > 0) {
      otherIndices.forEach(i => {
        const ratio = newMix[i].percentage / totalOther;
        newMix[i].percentage = Math.max(0, Math.round(newMix[i].percentage - (delta * ratio)));
      });
    }

    // Normalize to 100%
    const total = newMix.reduce((sum, p) => sum + p.percentage, 0);
    if (total !== 100) {
      const diff = 100 - total;
      newMix[otherIndices[0]].percentage += diff;
    }

    setPersonaMix(newMix);
  };

  const handlePersonaSelect = (index: number, personaId: string) => {
    const persona = AVAILABLE_PERSONAS.find(p => p.id === personaId);
    if (!persona) return;

    const newMix = [...personaMix];
    newMix[index] = { ...newMix[index], id: personaId, name: persona.name };
    setPersonaMix(newMix);
  };

  const handleSynthesize = async () => {
    if (droppedCards.length === 0) {
      alert('Please drop at least one KanBan card from the Vault');
      return;
    }

    setIsGenerating(true);
    
    try {
      // TODO: Integrate with AI synthesis service
      // For now, simulate generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockOutput = `🎨 Instagram ${selectedFormat.toUpperCase()} Content\n\n` +
        `Generated from ${droppedCards.length} source${droppedCards.length > 1 ? 's' : ''}\n\n` +
        `Persona Mix: ${personaMix.filter(p => p.name !== 'SELECT').map(p => `${p.name} (${p.percentage}%)`).join(', ')}\n\n` +
        `[AI-generated content would appear here based on:\n` +
        `- Source material from dropped cards\n` +
        `- Instagram best practices\n` +
        `- Selected format: ${selectedFormat}\n` +
        `- Persona blend with specified percentages\n` +
        (additionalPrompt ? `- Additional guidance: "${additionalPrompt}"\n` : '') +
        `]\n\n` +
        `This is a placeholder. Integration with CopyWriterPro coming soon! 🚀`;

      setOutput(mockOutput);
    } catch (error) {
      console.error('Synthesis failed:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleIterate = async () => {
    if (!iterationGuidance.trim()) {
      alert('Please provide guidance for iteration');
      return;
    }

    setIsGenerating(true);
    
    try {
      // TODO: Implement iteration logic
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const iteratedOutput = output + `\n\n--- ITERATION ---\n` +
        `User guidance: "${iterationGuidance}"\n` +
        `[Improved content based on feedback would appear here]\n`;
      
      setOutput(iteratedOutput);
      setIterationGuidance('');
    } catch (error) {
      console.error('Iteration failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const removeCard = (cardId: string | number) => {
    setDroppedCards(droppedCards.filter(c => c.id !== cardId));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[800px] h-[90vh] bg-gradient-to-br from-slate-900 via-slate-900 to-pink-900/20 rounded-2xl shadow-2xl flex flex-col border border-pink-500/30">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-slate-700/50 bg-slate-900/50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <h2 className="text-sm font-bold text-pink-400 tracking-wider uppercase">InstagramPro</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-4 space-y-3">
          {/* Top Row: Drop Zone + Format Selection */}
          <div className="grid grid-cols-[1fr_auto] gap-3">
            {/* Drop Zone */}
            <div
              ref={setNodeRef}
              className={`min-h-[120px] border-2 border-dashed rounded-lg p-3 transition-all ${
                isOver
                  ? 'border-pink-500 bg-pink-500/10'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              {droppedCards.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                  <Upload size={32} className="mb-2 opacity-50" />
                  <p>Drop Area. Make Kanban card this scale to fit</p>
                  <p className="text-xs mt-1">drop area perfectly in "coops" is when</p>
                  <p className="text-xs">dropped on to this area.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {droppedCards.map((card) => (
                    <div
                      key={card.id}
                      className="flex items-center gap-2 bg-slate-800 border border-pink-500/30 rounded px-3 py-1.5 text-sm"
                    >
                      <span className="text-white font-medium truncate max-w-[200px]">
                        {card.title}
                      </span>
                      <button
                        onClick={() => removeCard(card.id)}
                        className="text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Format Selection */}
            <div className="w-[180px] border border-slate-700 rounded-lg p-3 bg-slate-900/50">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                Format
              </div>
              <div className="space-y-2">
                {INSTAGRAM_FORMATS.map((format) => (
                  <label key={format.id} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedFormat === format.id}
                      onChange={() => setSelectedFormat(format.id)}
                      className="w-4 h-4 rounded border-slate-600 text-pink-500 focus:ring-pink-500/50 bg-slate-800"
                    />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                      {format.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* User Input Area */}
          <div>
            <textarea
              value={additionalPrompt}
              onChange={(e) => setAdditionalPrompt(e.target.value)}
              placeholder="User Input Area Text. This will be an additional prompt for the CreatorPro app. Simple text area. AI to read into context prior to generating content."
              className="w-full h-[80px] bg-black/50 border border-slate-700 rounded-lg p-3 text-sm text-white/90 placeholder-slate-400 resize-none focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50 transition-all"
            />
          </div>

          {/* Persona Mix with Knobs */}
          <div className="grid grid-cols-3 gap-4 py-2">
            {personaMix.map((persona, index) => (
              <div key={persona.id} className="flex flex-col items-center gap-2">
                {persona.name === 'SELECT' ? (
                  <select
                    value={persona.id}
                    onChange={(e) => handlePersonaSelect(index, e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-slate-300 focus:outline-none focus:border-pink-500"
                  >
                    <option value={`slot${index + 1}`}>SELECT</option>
                    {AVAILABLE_PERSONAS.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    {persona.name}
                  </div>
                )}
                <RotaryKnob
                  value={persona.percentage}
                  onChange={(val) => handleKnobChange(index, val)}
                  label=""
                  color={persona.name === 'SELECT' ? '#64748b' : '#ec4899'}
                  disabled={persona.name === 'SELECT'}
                />
              </div>
            ))}
          </div>

          {/* Synthesize Button */}
          <div className="flex justify-center pt-2">
            <button
              onClick={handleSynthesize}
              disabled={isGenerating || droppedCards.length === 0}
              className="px-8 py-2 bg-pink-600 hover:bg-pink-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold text-sm rounded-lg transition-all shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 disabled:shadow-none flex items-center gap-2"
            >
              {isGenerating && <Loader2 size={16} className="animate-spin" />}
              SYNTHESIZE
            </button>
          </div>

          {/* Output Area */}
          {output && (
            <>
              <div className="border border-slate-700 rounded-lg p-4 bg-slate-900/50 min-h-[200px] max-h-[300px] overflow-y-auto">
                <div className="text-sm text-white/90 whitespace-pre-wrap">
                  {output}
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-colors"
                  >
                    <Star
                      size={24}
                      className={star <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-slate-600'}
                    />
                  </button>
                ))}
              </div>

              {/* Iteration Input */}
              <div>
                <textarea
                  value={iterationGuidance}
                  onChange={(e) => setIterationGuidance(e.target.value)}
                  placeholder="Additional guidance from user"
                  className="w-full h-[60px] bg-black/50 border border-slate-700 rounded-lg p-3 text-sm text-white/90 placeholder-slate-400 resize-none focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50 transition-all"
                />
              </div>

              {/* Iterate Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleIterate}
                  disabled={isGenerating || !iterationGuidance.trim()}
                  className="px-6 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 text-slate-300 font-medium text-sm rounded-lg transition-all border border-slate-700 hover:border-pink-500/50"
                >
                  ITERATE
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

