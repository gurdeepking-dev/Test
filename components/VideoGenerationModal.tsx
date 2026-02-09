import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';

interface VideoGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageBase64: string | null;
  styleName: string;
}

const VideoGenerationModal: React.FC<VideoGenerationModalProps> = ({ isOpen, onClose, imageBase64, styleName }) => {
  const [status, setStatus] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [needsKeySelection, setNeedsKeySelection] = useState(false);

  // Reset state whenever the modal is opened or the source image changes
  useEffect(() => {
    if (isOpen) {
      setVideoUrl(null);
      setError(null);
      setStatus('');
      setIsGenerating(false);
      
      if (imageBase64) {
        checkKeyAndStart();
      }
    }
  }, [isOpen, imageBase64]);

  const checkKeyAndStart = async () => {
    // Check if aistudio global exists and if key is selected
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        setNeedsKeySelection(true);
        return;
      }
    }
    
    startGeneration();
  };

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Guidelines: Assume success and proceed immediately to avoid race condition
      setNeedsKeySelection(false);
      startGeneration();
    }
  };

  const startGeneration = async () => {
    if (!imageBase64) return;
    
    setIsGenerating(true);
    setError(null);
    setNeedsKeySelection(false);
    setVideoUrl(null); // Clear previous video URL before starting new generation
    
    try {
      const url = await geminiService.generateVideo(
        imageBase64, 
        `A high quality cinematic animation based on the ${styleName} theme. Fluid motion, artistic details, masterpiece aesthetic.`,
        (s) => setStatus(s)
      );
      setVideoUrl(url);
    } catch (err: any) {
      const msg = err.message || "";
      // If permission denied or entity not found, it likely needs a paid key selection
      if (msg.includes('403') || msg.includes('Permission Denied') || msg.includes('Requested entity was not found')) {
        setNeedsKeySelection(true);
      } else {
        setError(msg || "Failed to generate video. Please try again later.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Allow closing via backdrop even during generation */}
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-black text-slate-800 serif italic">AI Video Studio</h3>
            {/* Always show close button so user can cancel/exit */}
            <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors p-2 hover:bg-rose-50 rounded-full transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="aspect-square bg-slate-900 rounded-3xl overflow-hidden flex items-center justify-center relative border-4 border-rose-50 shadow-inner">
            {needsKeySelection ? (
              <div className="flex flex-col items-center gap-6 p-8 text-center animate-in fade-in duration-500">
                <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mb-2">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h4 className="text-white text-lg font-black uppercase tracking-tight">Paid API Key Required</h4>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed px-4">
                    Veo Video Generation requires a project with a billing account enabled.
                  </p>
                  <a 
                    href="https://ai.google.dev/gemini-api/docs/billing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-rose-400 text-[10px] font-black underline uppercase tracking-widest block mt-2 hover:text-rose-300"
                  >
                    View Billing Docs
                  </a>
                </div>
                <button 
                  onClick={handleOpenKeySelector}
                  className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.1em] shadow-xl hover:bg-rose-700 active:scale-95 transition-all"
                >
                  Select Paid API Key
                </button>
              </div>
            ) : videoUrl ? (
              <video 
                src={videoUrl} 
                controls 
                autoPlay 
                loop 
                className="w-full h-full object-cover"
              />
            ) : isGenerating ? (
              <div className="flex flex-col items-center gap-6 p-8 text-center">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-rose-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl animate-pulse">✨</span>
                    </div>
                </div>
                <div className="space-y-2">
                  <p className="text-rose-500 font-black text-xs uppercase tracking-[0.2em]">{status}</p>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed px-4">
                    This might take a moment. You can close this window; the process will continue in the background.
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-4 p-8 text-center">
                <span className="text-4xl mb-2">⚠️</span>
                <p className="text-red-500 text-xs font-black uppercase tracking-widest leading-relaxed px-4">{error}</p>
                <button 
                  onClick={startGeneration}
                  className="mt-4 px-6 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-rose-700 active:scale-95"
                >
                  Retry Generation
                </button>
              </div>
            ) : (
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Ready to generate</p>
            )}
          </div>

          {videoUrl && (
            <div className="flex flex-col gap-3">
              <a 
                href={videoUrl} 
                download={`video-${Date.now()}.mp4`}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all text-center flex items-center justify-center gap-3 shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Masterpiece
              </a>
              <p className="text-center text-[10px] font-black text-rose-500 uppercase tracking-widest">Perfect for Instagram Reels & Shorts! 🎬</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoGenerationModal;