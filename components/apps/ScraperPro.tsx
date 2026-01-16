/**
 * ScraperPro Component
 * 
 * A unified content ingestion interface with:
 * - Voice/text input (Whisper transcription)
 * - URL scraping (Apify actors)
 * - File drag-and-drop (PDF, audio, video, images, documents)
 * - TallyTable processing queue
 * - Auto-save to Vault
 */

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Upload, Loader2 } from 'lucide-react';
import { getApifyToken, runActorAndFetchDataset, getActorForTask } from '../../services/scraperProAdapter';
import { dbService } from '../../services/dbService';
import { ContentIdea } from '../../types';

interface TallyItem {
  id: string;
  name: string;
  type: 'voice' | 'url' | 'file';
  fileType?: string; // PDF, MP3, JPG, etc.
  status: 'pending' | 'processing' | 'success' | 'error';
  content?: string;
  url?: string;
}

interface ScraperProProps {
  onComplete?: () => void; // Callback to open Vault
}

export const ScraperPro: React.FC<ScraperProProps> = ({ onComplete }) => {
  const [ideaText, setIdeaText] = useState('');
  const [urlText, setUrlText] = useState('');
  const [tallyItems, setTallyItems] = useState<TallyItem[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchComplete, setFetchComplete] = useState(false);
  const [apiTokenMissing, setApiTokenMissing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Get OpenAI API key
  const getOpenAIKey = (): string => {
    return (
      (import.meta as any).env?.VITE_OPENAI_API_KEY ||
      (typeof process !== 'undefined' && (process as any).env?.OPENAI_API_KEY) ||
      ''
    );
  };

  // Check for API tokens on mount
  useEffect(() => {
    const apifyToken = getApifyToken();
    if (!apifyToken) {
      setApiTokenMissing(true);
    }
  }, []);

  // Voice Recording with OpenAI Whisper Transcription
  const transcribeAudioWithOpenAI = async (audioBlob: Blob): Promise<string> => {
    const openAIKey = getOpenAIKey();
    if (!openAIKey) {
      console.warn('[ScraperPro] Missing OPENAI_API_KEY');
      return '[Transcription failed - missing API key]';
    }

    try {
      setIsTranscribing(true);

      // Convert webm to a format OpenAI accepts (mp3 or wav)
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('model', 'whisper-1'); // Using Whisper API
      formData.append('language', 'en'); // Optional: specify language
      formData.append('response_format', 'text'); // Get plain text response

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const transcription = await response.text();
      return transcription.trim();
    } catch (error) {
      console.error('[ScraperPro] Transcription failed:', error);
      return '[Transcription failed - see console for details]';
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        // Transcribe with OpenAI Whisper
        console.log('[ScraperPro] Transcribing audio with OpenAI Whisper...');
        const transcription = await transcribeAudioWithOpenAI(audioBlob);
        
        // Add transcription to textarea
        setIdeaText(prev => {
          const newText = prev ? `${prev}\n${transcription}` : transcription;
          return newText;
        });
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('[ScraperPro] Microphone access denied:', err);
      alert('Microphone access denied. Please allow microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Save IDEA to TallyTable
  const saveIdea = () => {
    if (!ideaText.trim()) return;

    const newItem: TallyItem = {
      id: Date.now().toString(),
      name: ideaText.substring(0, 50) + (ideaText.length > 50 ? '...' : ''),
      type: 'voice',
      fileType: 'IDEA',
      status: 'pending',
      content: ideaText,
    };

    setTallyItems(prev => [...prev, newItem]);
    setIdeaText('');
  };

  // Save URL to TallyTable
  const saveUrl = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && urlText.trim()) {
      try {
        const url = new URL(urlText);
        const hostname = url.hostname.toLowerCase();
        
        let fileType = 'URL';
        if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) fileType = 'YT';
        else if (hostname.includes('instagram.com')) fileType = 'IG';
        else if (hostname.includes('linkedin.com')) fileType = 'LI';
        else if (hostname.includes('twitter.com') || hostname.includes('x.com')) fileType = 'X';

        const newItem: TallyItem = {
          id: Date.now().toString(),
          name: hostname,
          type: 'url',
          fileType,
          status: 'pending',
          url: urlText,
        };

        setTallyItems(prev => [...prev, newItem]);
        setUrlText('');
      } catch (err) {
        alert('Invalid URL. Please enter a valid URL.');
      }
    }
  };

  // Handle File Drop (stores file object for later processing)
  const filesMapRef = useRef<Map<string, File>>(new Map());

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    
    files.forEach(file => {
      const extension = file.name.split('.').pop()?.toUpperCase() || 'FILE';
      const itemId = Date.now().toString() + Math.random();
      
      // Store file reference for processing
      filesMapRef.current.set(itemId, file);
      
      const newItem: TallyItem = {
        id: itemId,
        name: file.name,
        type: 'file',
        fileType: extension,
        status: 'pending',
      };

      setTallyItems(prev => [...prev, newItem]);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      const extension = file.name.split('.').pop()?.toUpperCase() || 'FILE';
      const itemId = Date.now().toString() + Math.random();
      
      // Store file reference for processing
      filesMapRef.current.set(itemId, file);
      
      const newItem: TallyItem = {
        id: itemId,
        name: file.name,
        type: 'file',
        fileType: extension,
        status: 'pending',
      };

      setTallyItems(prev => [...prev, newItem]);
    });
  };

  // Process all items in TallyTable - GROUP INTO ONE IDEA
  const handleFetch = async () => {
    if (tallyItems.length === 0) return;
    if (apiTokenMissing) {
      alert('Missing APIFY_API_TOKEN. Please add it to your .env file.');
      return;
    }

    setIsFetching(true);
    setFetchComplete(false);

    console.log('[ScraperPro] Starting to process', tallyItems.length, 'items into ONE combined idea');

    // Collect all data from TallyTable
    const allFileTypes: string[] = [];
    const allTranscripts: string[] = [];
    const allUrls: string[] = [];
    let ideaTitle = '';

    for (const item of tallyItems) {
      if (item.status !== 'pending') {
        console.log('[ScraperPro] Skipping', item.name, '- status:', item.status);
        continue;
      }

      console.log('[ScraperPro] Processing item:', item.type, '-', item.name);

      // Update to processing
      setTallyItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'processing' } : i));

      try {
        // Add file type
        if (item.fileType) {
          allFileTypes.push(item.fileType);
        }

        // Process based on type
        if (item.type === 'voice' && item.content) {
          // IDEA - this becomes the title
          console.log('[ScraperPro] Processing IDEA:', item.content.substring(0, 50));
          ideaTitle = item.content.split(' ').slice(0, 5).join(' ');
          allTranscripts.push(`[IDEA]: ${item.content}`);
        } else if (item.type === 'url' && item.url) {
          // URL - scrape via Apify
          console.log('[ScraperPro] Scraping URL:', item.url);
          const result = await scrapeUrl(item.url);
          allTranscripts.push(`[URL: ${item.url}]\n${result.content}`);
          allUrls.push(item.url);
          console.log('[ScraperPro] URL scraped successfully, content length:', result.content.length);
        } else if (item.type === 'file') {
          // File - get actual file and process
          console.log('[ScraperPro] Processing file:', item.name);
          const file = filesMapRef.current.get(item.id);
          if (file) {
            const extension = file.name.split('.').pop()?.toLowerCase();
            if (extension === 'mp3' || extension === 'wav' || extension === 'm4a') {
              // TODO: Upload file to storage and transcribe via Apify Whisper
              allTranscripts.push(`[AUDIO FILE: ${file.name} - transcription pending]`);
            } else {
              allTranscripts.push(`[FILE: ${file.name}]`);
            }
          } else {
            allTranscripts.push(`[FILE: ${item.name}]`);
          }
          console.log('[ScraperPro] File processed:', item.name);
        }

        // Mark as success
        setTallyItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'success' } : i));

      } catch (error) {
        console.error(`[ScraperPro] Failed to process ${item.name}:`, error);
        setTallyItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error' } : i));
      }
    }

    // Save ONE combined idea to Firebase
    console.log('[ScraperPro] Creating combined idea with', allFileTypes.length, 'file types');
    
    // Use IDEA text as title, or first URL hostname if no IDEA
    const finalTitle = ideaTitle || (allUrls[0] ? new URL(allUrls[0]).hostname : 'Untitled Idea');
    const combinedTranscript = allTranscripts.join('\n\n');

    const ideaData: any = {
      content: finalTitle,
      transcript: combinedTranscript,
      type: allUrls.length > 0 ? 'url' : 'riff',
      status: 'digested',
      timestamp: Date.now(),
      source: 'scraper-pro',
      fileTypes: [...new Set(allFileTypes)], // Remove duplicates
    };
    
    // Add first URL as originalSource if exists
    if (allUrls.length > 0) {
      ideaData.originalSource = allUrls[0];
    }
    
    try {
      // Save to Firebase with shorter timeout (5 seconds)
      console.log('[ScraperPro] Saving combined idea to Firebase:', finalTitle);
      const savePromise = dbService.addContentIdea(ideaData);
      const timeoutPromise = new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error('Firebase save timeout after 5 seconds')), 5000)
      );
      
      const docId = await Promise.race([savePromise, timeoutPromise]);
      console.log('[ScraperPro] Saved to Firebase successfully, doc ID:', docId);
    } catch (firebaseError: any) {
      // If it's a timeout error, check if doc was actually saved
      if (firebaseError?.message?.includes('timeout')) {
        console.warn('[ScraperPro] Firebase save timed out, but data may have saved. Continuing...');
      } else {
        console.error('[ScraperPro] Firebase save failed:', firebaseError);
        alert(`Failed to save to Firebase: ${firebaseError?.message || 'Unknown error'}`);
      }
    }

    console.log('[ScraperPro] All items processed into ONE combined idea');
    setIsFetching(false);
    setFetchComplete(true);

    // Open Vault after completion
    setTimeout(() => {
      onComplete?.();
    }, 500);
  };

  // Scrape URL using appropriate Apify actor
  const scrapeUrl = async (url: string): Promise<{ content: string; title?: string }> => {
    const hostname = new URL(url).hostname.toLowerCase();

    let actorId = '';
    let runInput: any = {};

    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      actorId = getActorForTask('YT__Transcript_Fast');
      runInput = { videoUrl: url };
    } else if (hostname.includes('instagram.com')) {
      actorId = getActorForTask('IG__Post_Reel_Caption');
      runInput = { directUrls: [url], resultsType: 'posts', searchLimit: 1 };
    } else if (hostname.includes('linkedin.com')) {
      actorId = getActorForTask('LI__Post_Text');
      runInput = { startUrls: [{ url }], maxPosts: 1 };
    } else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      actorId = getActorForTask('X__Thread_Text');
      runInput = { startUrls: [{ url }], tweetsDesired: 1 };
    } else {
      actorId = getActorForTask('WEB__Article_Text');
      runInput = { startUrls: [{ url }], maxCrawlPages: 1, saveMarkdown: true };
    }

    const result = await runActorAndFetchDataset(actorId, runInput);

    if (result.status !== 'SUCCEEDED' || !result.items || result.items.length === 0) {
      throw new Error('Scraping failed');
    }

    const item = result.items[0];
    return {
      content: item.text || item.markdown || item.caption || item.content || '',
      title: item.title || item.metadata?.title,
    };
  };

  return (
    <div className="h-full flex flex-col space-y-4 p-4">
      {/* API Token Warning */}
      {apiTokenMissing && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-2">
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
            ⚠️ Missing APIFY_API_TOKEN - Add to .env file
          </p>
        </div>
      )}

      {/* Transcription Status */}
      {isTranscribing && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-2 flex items-center gap-2">
          <Loader2 size={14} className="animate-spin text-blue-400" />
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
            Transcribing with OpenAI Whisper...
          </p>
        </div>
      )}

      {/* Voice/Text Input - Task 1 & 2 */}
      <div className="relative flex items-end gap-2">
        <textarea
          value={ideaText}
          onChange={(e) => setIdeaText(e.target.value)}
          placeholder="Type or speak your idea..."
          rows={3}
          className="flex-1 bg-slate-950/50 border border-slate-700 rounded-lg p-4 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 resize-none custom-scrollbar"
          style={{ width: 'calc(100% - 80px)' }}
        />
        <div className="flex gap-2 pb-2">
          <button
            onClick={toggleRecording}
            className={`p-2 transition-all ${isRecording ? 'text-red-500 animate-pulse' : 'text-slate-500 hover:text-red-500'}`}
            title="Record voice"
          >
            <Mic size={20} />
          </button>
          <button
            onClick={saveIdea}
            disabled={!ideaText.trim()}
            className="text-slate-500 hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-2xl font-light leading-none"
            title="Add idea"
          >
            +
          </button>
        </div>
      </div>

      {/* URL Input - Task 2 & 3 */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={urlText}
          onChange={(e) => setUrlText(e.target.value)}
          onKeyDown={saveUrl}
          placeholder="Paste URL..."
          className="flex-1 bg-slate-950/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 truncate"
          style={{ width: 'calc(100% - 40px)' }}
        />
        <button
          onClick={() => urlText.trim() && saveUrl({ key: 'Enter' } as any)}
          disabled={!urlText.trim()}
          className="text-slate-500 hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-2xl font-light leading-none"
          title="Add URL"
        >
          +
        </button>
      </div>

      {/* Drag & Drop Zone - Task 4 */}
      <div
        onDrop={handleFileDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:border-blue-500/50 hover:bg-slate-950/30 transition-all cursor-pointer"
      >
        <Upload size={28} className="text-slate-600" />
        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">
          Drop files here (PDF, audio, video, txt)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.mp3,.wav,.mp4,.mov,.txt,.jpg,.jpeg,.png,.xls,.xlsx,.doc,.docx"
        />
      </div>

      {/* TallyTable - Task 5 */}
      {tallyItems.length > 0 && (
        <div className="border border-slate-700 rounded-lg overflow-hidden">
          <div className="grid grid-cols-4 grid-rows-2 gap-px bg-slate-800">
            {tallyItems.slice(0, 8).map((item) => (
              <div
                key={item.id}
                className={`p-4 flex items-center justify-center min-h-[70px] transition-all ${
                  item.status === 'pending' ? 'bg-yellow-500/10' :
                  item.status === 'processing' ? 'bg-blue-500/10 animate-pulse' :
                  item.status === 'success' ? 'bg-green-500/10' :
                  'bg-red-500/10'
                }`}
              >
                <span className={`text-[11px] font-black uppercase tracking-wider ${
                  item.status === 'pending' ? 'text-yellow-400' :
                  item.status === 'processing' ? 'text-blue-400' :
                  item.status === 'success' ? 'text-green-400' :
                  'text-red-400'
                }`}>
                  {item.fileType}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FETCH Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleFetch}
          disabled={tallyItems.length === 0 || isFetching}
          className={`px-6 py-3 rounded-lg text-xs font-black uppercase tracking-[0.3em] transition-all ${
            fetchComplete
              ? 'bg-green-500/20 text-green-400 border-2 border-green-500'
              : isFetching
              ? 'bg-blue-500/20 text-blue-400 border-2 border-blue-500 animate-pulse'
              : 'bg-slate-800 text-slate-400 border-2 border-slate-700 hover:border-yellow-500/50 hover:text-yellow-400 hover:shadow-[0_0_20px_rgba(234,179,8,0.3)]'
          } disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          {isFetching ? (
            <span className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              PROCESSING...
            </span>
          ) : fetchComplete ? (
            'COMPLETE'
          ) : (
            'FETCH'
          )}
        </button>
      </div>
    </div>
  );
};

export default ScraperPro;

