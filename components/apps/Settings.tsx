
import React, { useState, useEffect, useRef } from 'react';
import { UserPersona } from '../../types';
import { parseQuestionnaire } from '../../services/geminiService';

const QUESTIONNAIRE_TEMPLATE = `--- IDENTITY QUESTIONNAIRE ---
Please fill out the details below. Our AI will ingest this file to calibrate your writing engine.

[PROFILE_NAME]
Name of this Persona (e.g., Personal Brand, Corporate Agency, Side Hustle)
Answer: 

[USER_IDENTITY]
Who are you? (Your name, title, experience, and background)
Answer: 

[BUSINESS_DESCRIPTION]
What does your business do? What are its goals?
Answer: 

[BRANDING_AND_LOGO]
Describe your visual brand. Logo details, colors, fonts, or aesthetic vibe.
Answer: 

[WRITING_VOICES_AND_STYLES]
List the voices you want to output (e.g., Edgy Visionary, Clinical Analyst, Friendly Coach). 
Describe the "rules" of your voice.
Answer: 

[CORE_FACTS]
List absolute truths about your business or industry that the AI should always reference.
Answer: 

[KEY_FIGURES]
Important numbers, ROI stats, case study metrics, or growth percentages.
Answer: 

[TARGET_AUDIENCE]
Who are you speaking to? (Demographics, pain points, desires)
Answer: 

--- END OF FILE ---`;

const Settings: React.FC = () => {
  const [personas, setPersonas] = useState<UserPersona[]>([]);
  const [activePersonaId, setActivePersonaId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('retro_personas');
    if (saved) {
      const parsed = JSON.parse(saved);
      setPersonas(parsed);
      const active = localStorage.getItem('active_persona_id');
      if (active) setActivePersonaId(active);
      else if (parsed.length > 0) setActivePersonaId(parsed[0].id);
    }
  }, []);

  const savePersonasToStore = (newPersonas: UserPersona[]) => {
    setPersonas(newPersonas);
    localStorage.setItem('retro_personas', JSON.stringify(newPersonas));
  };

  const selectPersona = (id: string) => {
    setActivePersonaId(id);
    localStorage.setItem('active_persona_id', id);
  };

  const downloadTemplate = () => {
    const blob = new Blob([QUESTIONNAIRE_TEMPLATE], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'identity_questionnaire.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setIsProcessing(true);
      try {
        const parsed = await parseQuestionnaire(content);
        const newPersona: UserPersona = {
          ...parsed as UserPersona,
          id: Date.now().toString(),
        };
        const updated = [...personas, newPersona];
        savePersonasToStore(updated);
        selectPersona(newPersona.id);
        alert(`Identity "${newPersona.name}" has been successfully ingested.`);
      } catch (err) {
        alert("Critical failure in Identity Neural Parser. Check your file format.");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  const deletePersona = (id: string) => {
    if (confirm("Permanently delete this identity profile?")) {
      const updated = personas.filter(p => p.id !== id);
      savePersonasToStore(updated);
      if (activePersonaId === id && updated.length > 0) selectPersona(updated[0].id);
    }
  };

  // Data Management Features
  const exportFullState = () => {
    const state = {
      ideas: JSON.parse(localStorage.getItem('retro_content_ideas') || '[]'),
      personas: JSON.parse(localStorage.getItem('retro_personas') || '[]'),
      activePersonaId: localStorage.getItem('active_persona_id')
    };
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content_factory_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFullState = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const state = JSON.parse(event.target?.result as string);
        if (state.ideas) localStorage.setItem('retro_content_ideas', JSON.stringify(state.ideas));
        if (state.personas) localStorage.setItem('retro_personas', JSON.stringify(state.personas));
        if (state.activePersonaId) localStorage.setItem('active_persona_id', state.activePersonaId);
        window.location.reload(); // Quick refresh to apply everything
      } catch (err) {
        alert("Invalid backup file format.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full flex flex-col space-y-6 font-mono">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
         <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Identity Calibration</h3>
         <div className="flex gap-2">
            <button 
              onClick={downloadTemplate}
              className="text-[8px] font-black uppercase text-blue-400 border border-blue-500/30 px-2 py-1 rounded hover:bg-blue-500/10 transition-colors"
            >
              Get Questionnaire
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest disabled:opacity-50"
            >
              {isProcessing ? 'UPLOADING...' : 'Upload Identity File'}
            </button>
         </div>
      </div>

      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt" />
      <input type="file" ref={importInputRef} onChange={importFullState} className="hidden" accept=".json" />

      <div className="flex-grow overflow-y-auto space-y-3 custom-scrollbar pr-1">
        {personas.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full border border-slate-800 flex items-center justify-center opacity-20">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4v16m8-8H4" /></svg>
            </div>
            <div className="text-center space-y-1">
              <p className="text-[9px] uppercase font-black text-slate-600 tracking-widest">Neural Vault Empty</p>
              <p className="text-[8px] text-slate-700 uppercase tracking-tighter">Download the questionnaire above to get started.</p>
            </div>
          </div>
        ) : (
          personas.map(p => (
            <div 
              key={p.id}
              onClick={() => selectPersona(p.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${activePersonaId === p.id ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.05)]' : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-black uppercase text-slate-200 tracking-tight">{p.name}</span>
                {activePersonaId === p.id && (
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="text-[8px] font-black text-blue-400 uppercase">Selected</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed uppercase tracking-tighter mb-4">
                {p.businessInfo}
              </p>
              
              <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button 
                  onClick={(e) => { e.stopPropagation(); deletePersona(p.id); }} 
                  className="text-[8px] text-red-500/60 hover:text-red-500 uppercase font-black flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Purge Profile
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-slate-800 pt-6 mt-4 pb-2">
         <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Neural State Management</h4>
         <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={exportFullState}
              className="flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-400 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export State
            </button>
            <button 
              onClick={() => importInputRef.current?.click()}
              className="flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-400 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Import State
            </button>
         </div>
      </div>
    </div>
  );
};

export default Settings;
