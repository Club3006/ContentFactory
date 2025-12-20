
import React, { useState, useRef, useEffect } from 'react';
import { chatAssistant } from '../../services/geminiService';
import { ChatMessage, ContentIdea } from '../../types';
import { handleShiftEnter } from '../../utils/eventUtils';

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const history = newMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      const reply = await chatAssistant(history);
      setMessages([...newMessages, { role: 'model', text: reply }]);
    } catch (e) {
      setMessages([...newMessages, { role: 'model', text: "Service temporary unavailable. Please verify API configuration." }]);
    } finally {
      setLoading(false);
    }
  };

  const commitToVault = (text: string) => {
    const newIdea: ContentIdea = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      content: text.substring(0, 100) + "...",
      type: 'riff',
      transcript: text,
      status: 'digested'
    };
    
    const saved = localStorage.getItem('retro_content_ideas');
    const ideas = saved ? JSON.parse(saved) : [];
    localStorage.setItem('retro_content_ideas', JSON.stringify([newIdea, ...ideas]));
    alert("Idea committed to Vault.");
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/40 rounded-xl overflow-hidden border border-slate-800 font-mono">
      <div className="flex-grow overflow-y-auto p-3 space-y-4 custom-scrollbar" ref={scrollRef}>
        <div className="flex items-center gap-3 text-blue-500/80 sticky top-0 bg-slate-950/80 backdrop-blur-sm pb-2 z-10">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="text-[9px] font-black uppercase tracking-[0.3em]">Idea Capture Assistant Active</span>
        </div>

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 opacity-20 space-y-2">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
             <div className="text-[9px] uppercase tracking-[0.5em] text-center">Awaiting Spark...</div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`group relative max-w-[90%] rounded-xl px-4 py-3 text-xs leading-relaxed shadow-lg ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white font-medium border border-blue-400/30' 
                : 'bg-slate-900 text-slate-300 border border-slate-800'
            }`}>
              <div className="whitespace-pre-wrap">{m.text}</div>
              
              {m.role === 'model' && (
                <button 
                  onClick={() => commitToVault(m.text)}
                  className="absolute -bottom-2 -right-2 bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all border border-indigo-400 shadow-xl"
                >
                  Commit to Vault
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex gap-2 items-center">
              <span className="blink !w-1.5 h-3"></span>
              <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Processing...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-2 bg-black/40 border-t border-slate-800 shrink-0">
        <div className="relative flex items-center">
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => handleShiftEnter(e, sendMessage)}
            rows={1}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-xs text-blue-400 focus:border-blue-500 outline-none transition-all pr-12 placeholder-slate-800 font-mono resize-none custom-scrollbar min-h-[44px]"
            placeholder="[ ENTER CREATIVE QUERY ]"
            autoFocus
          />
          <button 
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="absolute right-2 top-2 p-1.5 text-blue-500 hover:text-blue-400 disabled:opacity-30 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
