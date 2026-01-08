import React, { useState } from 'react';
import { Copy, Loader2, Sparkles } from 'lucide-react';
import { generateLinkedInPost, generateLinkedInArticle } from '../../services/linkedInService';

interface Props {
    onClose: () => void;
    initialTranscript?: string;
}

export const LinkedInCreator: React.FC<Props> = ({ onClose, initialTranscript = '' }) => {
    const [transcript, setTranscript] = useState(initialTranscript);
    const [contentType, setContentType] = useState<'post' | 'article'>('post');
    const [output, setOutput] = useState('');
    const [articleTitle, setArticleTitle] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [additionalUrl, setAdditionalUrl] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            if (data.type === 'podcast-episode' && data.transcript) {
                setTranscript(data.transcript);
            }
        } catch (err) {
            console.error('Failed to parse drop data:', err);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleGenerate = async () => {
        if (!transcript.trim()) {
            setError("Please provide a transcript.");
            return;
        }

        setError(null);
        setIsGenerating(true);
        setOutput('');
        setArticleTitle('');

        try {
            if (contentType === 'post') {
                const post = await generateLinkedInPost(transcript);
                setOutput(post);
            } else {
                const article = await generateLinkedInArticle(transcript);
                setArticleTitle(article.title);
                setOutput(article.content);
            }
        } catch (err) {
            setError((err as Error).message || "Failed to generate content.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        const fullContent = contentType === 'article' && articleTitle
            ? `${articleTitle}\n\n${output}`
            : output;
        navigator.clipboard.writeText(fullContent);
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 font-mono text-slate-200">
            {/* Body */}
            <div className="flex-grow p-6 overflow-y-auto space-y-4">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded text-xs">
                        ERROR: {error}
                    </div>
                )}

                {/* Content Type Selector */}
                <div className="space-y-2">
                    <label className="text-[10px] uppercase text-blue-200/70 font-bold">Content Type</label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setContentType('post')}
                            className={`flex-1 px-4 py-2 rounded text-xs font-bold uppercase transition-all ${contentType === 'post'
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                : 'text-slate-500 border border-transparent hover:text-emerald-400 hover:border-emerald-500/20 hover:bg-emerald-500/5'
                                }`}
                        >
                            Post
                        </button>
                        <button
                            onClick={() => setContentType('article')}
                            className={`flex-1 px-4 py-2 rounded text-xs font-bold uppercase transition-all ${contentType === 'article'
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                : 'text-slate-500 border border-transparent hover:text-emerald-400 hover:border-emerald-500/20 hover:bg-emerald-500/5'
                                }`}
                        >
                            Article
                        </button>
                    </div>
                </div>

                {/* Transcript Input */}
                <div className="space-y-2">
                    <label className="text-[10px] uppercase text-blue-200/70 font-bold">Transcript</label>
                    <textarea
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={`w-full h-10 bg-transparent border rounded p-2 text-xs font-mono resize-none focus:outline-none text-white/90 placeholder-slate-600 transition-all ${isDragOver
                            ? 'border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                            : 'border-transparent focus:border-emerald-500 focus:bg-emerald-500/10'
                            }`}
                        placeholder={isDragOver ? 'Drop podcast episode here...' : 'Paste your podcast transcript here or drag from Podcast Vault...'}
                    />
                </div>

                {/* Additional Data Sources */}
                <div className="space-y-2">
                    <label className="text-[10px] uppercase text-blue-200/70 font-bold">Additional Sources (Optional)</label>

                    {/* URL Input */}
                    <input
                        type="url"
                        value={additionalUrl}
                        onChange={(e) => setAdditionalUrl(e.target.value)}
                        placeholder="https://... (URL for additional context)"
                        className="w-full h-10 bg-transparent border border-transparent rounded p-2 text-xs font-mono focus:outline-none text-white/90 placeholder-slate-600 transition-all focus:border-emerald-500 focus:bg-emerald-500/10"
                    />

                    {/* File Upload */}
                    <div className="relative">
                        <input
                            type="file"
                            accept=".pdf,.txt"
                            multiple
                            onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                files.forEach(file => {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                        setUploadedFiles(prev => [...prev, event.target?.result as string]);
                                    };
                                    reader.readAsText(file);
                                });
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            id="file-upload"
                        />
                        <label
                            htmlFor="file-upload"
                            className="w-full h-10 bg-transparent border border-transparent rounded px-2 py-2 text-xs font-mono cursor-pointer transition-all hover:border-emerald-500/20 hover:bg-emerald-500/5 flex items-center text-slate-500 hover:text-emerald-400"
                        >
                            📎 Upload PDF or TXT files
                        </label>
                    </div>

                    {uploadedFiles.length > 0 && (
                        <div className="text-[9px] text-emerald-400">
                            {uploadedFiles.length} file(s) uploaded
                        </div>
                    )}
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !transcript.trim()}
                    className="w-full text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-300 px-6 py-3 rounded text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles size={16} />
                            Generate {contentType === 'post' ? 'Post' : 'Article'}
                        </>
                    )}
                </button>

                {/* Output */}
                {output && (
                    <div className="space-y-2 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] uppercase text-emerald-200/70 font-bold">Generated Content</label>
                            <button
                                onClick={handleCopy}
                                className="text-xs text-emerald-400 hover:text-white flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded border border-emerald-500/20 transition-all hover:bg-emerald-500/20"
                            >
                                <Copy size={12} />
                                Copy
                            </button>
                        </div>

                        {articleTitle && (
                            <div className="bg-blue-900/10 border border-blue-500/20 rounded p-3">
                                <p className="text-sm font-bold text-blue-300">{articleTitle}</p>
                            </div>
                        )}

                        <div className="bg-emerald-900/10 border border-emerald-500/20 rounded p-4 text-sm font-mono text-white/90 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto custom-scrollbar">
                            {output}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="h-1 border-t border-white/5 bg-slate-900 shrink-0"></div>
        </div>
    );
};
