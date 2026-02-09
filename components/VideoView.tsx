
import React, { useState, useRef, useEffect } from 'react';
import { klingService, KlingParams } from '../services/klingService';
import { geminiService } from '../services/geminiService';
import { storageService } from '../services/storage';
import { analytics } from '../services/analytics';
import { logger } from '../services/logger';
import { SampleVideo, Coupon } from '../types';

const VideoView: React.FC = () => {
  const [photoStart, setPhotoStart] = useState<string | null>(null);
  const [photoEnd, setPhotoEnd] = useState<string | null>(null);
  const [showEndFrame, setShowEndFrame] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [resolution, setResolution] = useState<'540P' | '720P' | '1080P'>('540P');
  const [duration, setDuration] = useState<'5' | '8'>('5');
  const [sendToEmail, setSendToEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const [samples, setSamples] = useState<SampleVideo[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [engine, setEngine] = useState<'kling' | 'gemini'>('gemini');
  const [needsKeySelection, setNeedsKeySelection] = useState(false);

  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    storageService.getAdminSettings().then(s => {
      setSettings(s);
      setSamples(s.videoSamples || []);
    });
  }, []);

  const calculatePrice = () => {
    if (!settings) return 0;
    const base = settings.payment.videoBasePrice || 20;
    let multiplier = 1.0;
    if (duration === '8') multiplier += 0.3;
    if (resolution === '1080P') multiplier += 0.3;
    let subtotal = Math.ceil(base * multiplier * 1.5);
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percentage') subtotal -= (subtotal * appliedCoupon.value / 100);
      else subtotal -= appliedCoupon.value;
    }
    return Math.max(0, Math.ceil(subtotal));
  };

  const handleGenerate = async (isTest: boolean = false) => {
    if (!photoStart) return alert("Upload a starting image.");
    const price = calculatePrice();
    
    // Check if key is needed before payment
    if (engine === 'gemini' && window.aistudio) {
      if (!(await window.aistudio.hasSelectedApiKey())) {
        setNeedsKeySelection(true);
        return;
      }
    }

    if (isTest || price === 0) {
      const paymentId = `free_${Date.now()}`;
      setCurrentPaymentId(paymentId);
      startRender(paymentId);
      return;
    }

    setLoading(true);
    setStatus("Initiating Payment...");
    try {
      const rzp = new (window as any).Razorpay({
        key: settings.payment.keyId,
        amount: price * 100,
        currency: settings.payment.currency || 'INR',
        name: "AI Video Studio",
        handler: async (res: any) => {
          const paymentId = res.razorpay_payment_id;
          setCurrentPaymentId(paymentId);
          await storageService.saveTransaction({
            razorpay_payment_id: paymentId,
            user_email: email || 'guest@anonymous.com',
            amount: price,
            items: [`Video Render (${engine})`],
            status: 'success',
            render_status: 'pending'
          });
          startRender(paymentId);
        },
        prefill: { email },
        theme: { color: "#5b4cd4" },
        modal: { ondismiss: () => setLoading(false) }
      });
      rzp.open();
    } catch (e) {
      setLoading(false);
      alert("Payment gateway failed to load.");
    }
  };

  const startRender = async (paymentId: string) => {
    setLoading(true);
    setRenderError(null);
    try {
      console.log(`[VideoView] Starting ${engine} render...`);
      let url = (engine === 'kling') 
        ? await klingService.generateVideo(photoStart!, showEndFrame ? photoEnd : null, { prompt, duration: '5', aspect_ratio: '9:16', mode: 'std' }, setStatus)
        : await geminiService.generateVideo(photoStart!, prompt, setStatus);
      
      setVideoUrl(url);
      await storageService.updateTransactionStatus(paymentId, { render_status: 'completed' });
    } catch (err: any) {
      console.error("[VideoView] Render failure:", err);
      setRenderError(err.message || "An unexpected error occurred during rendering.");
      await storageService.updateTransactionStatus(paymentId, { render_status: 'failed' });
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const currencySymbol = storageService.getCurrencySymbol(settings?.payment.currency);

  return (
    <div className="max-w-md mx-auto bg-[#0d0d0d] text-white rounded-[3rem] shadow-2xl overflow-hidden font-sans flex flex-col mb-20 relative z-10">
      <div className="p-10 pt-20 flex flex-col gap-4 bg-gradient-to-b from-white/10 to-transparent">
        <h2 className="text-xl font-black uppercase text-center italic tracking-tighter">AI Animator</h2>
        <div className="flex bg-white/5 p-1 rounded-xl self-center border border-white/5">
          <button onClick={() => setEngine('kling')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${engine === 'kling' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Kling Engine</button>
          <button onClick={() => setEngine('gemini')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${engine === 'gemini' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500'}`}>Gemini Engine</button>
        </div>
      </div>

      <div className="px-6 space-y-8 pb-12">
        {renderError && (
          <div className="bg-rose-950/40 border-2 border-rose-500/50 rounded-[2.5rem] p-8 space-y-4 animate-in zoom-in-95">
            <h3 className="text-lg font-black text-rose-500 italic">Render Failed</h3>
            <p className="text-xs text-rose-200/70 font-medium leading-relaxed uppercase">{renderError}</p>
            <button onClick={() => setRenderError(null)} className="w-full py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase">Back to Editor</button>
          </div>
        )}

        {engine === 'gemini' && !renderError && (
          <div className="bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20 text-center">
            <p className="text-[9px] font-black uppercase text-rose-400 tracking-widest leading-relaxed">
              💡 Tip: Baby photos are strictly monitored by Gemini. Kling might be more flexible.
            </p>
          </div>
        )}

        {!renderError && (
          <>
            <div className="grid grid-cols-1 gap-4">
              <div onClick={() => startInputRef.current?.click()} className="aspect-[4/3] bg-[#1a1a1a] rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center cursor-pointer overflow-hidden shadow-inner">
                {photoStart ? <img src={photoStart} className="w-full h-full object-cover" /> : <div className="text-center space-y-2"><span className="text-3xl">📸</span><p className="text-[10px] font-black uppercase text-slate-500">Add Photo</p></div>}
              </div>
            </div>

            {photoStart && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4">
                <textarea 
                  value={prompt} 
                  onChange={e => setPrompt(e.target.value)} 
                  placeholder="Describe how the image should move (e.g. hair blowing, smiling, waving...)" 
                  className="w-full bg-[#1a1a1a] border-2 border-white/5 rounded-3xl p-6 text-sm h-32 resize-none outline-none focus:border-indigo-500 transition-all" 
                />
                
                <div className="space-y-3">
                  <button onClick={() => handleGenerate(false)} disabled={loading} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-lg shadow-xl border-b-4 border-indigo-800 active:scale-95 transition-all disabled:opacity-50">
                    {loading ? "Please wait..." : `✨ Animate (${currencySymbol}${calculatePrice()})`}
                  </button>
                  <button onClick={() => handleGenerate(true)} className="w-full py-3 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">Try for Free 🛠️</button>
                </div>
              </div>
            )}
          </>
        )}

        {videoUrl && (
          <div className="fixed inset-0 z-[120] bg-black flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-sm aspect-[9/16] bg-slate-900 rounded-[3rem] overflow-hidden border-4 border-white/10 shadow-2xl relative">
              <video src={videoUrl} controls autoPlay loop className="w-full h-full object-cover" />
              <button onClick={() => setVideoUrl(null)} className="absolute top-6 right-6 p-3 bg-black/50 backdrop-blur-md rounded-full text-white">✕</button>
            </div>
            <a href={videoUrl} download="ai-video.mp4" className="mt-8 w-full max-w-xs py-5 bg-white text-black rounded-[2rem] font-black uppercase text-center shadow-xl">Download MP4</a>
          </div>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 z-[130] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-12 text-center gap-6 animate-in fade-in">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
            <div className={`absolute inset-0 border-4 ${engine === 'gemini' ? 'border-rose-500' : 'border-indigo-500'} border-t-transparent rounded-full animate-spin`}></div>
          </div>
          <div className="space-y-2">
            <p className={`${engine === 'gemini' ? 'text-rose-400' : 'text-indigo-400'} font-black uppercase tracking-[0.3em] text-[11px] animate-pulse`}>
              {status || 'Connecting to GPU...'}
            </p>
            <p className="text-slate-500 text-[9px] uppercase font-bold tracking-widest max-w-[200px] mx-auto">
              Rendering may take up to 2 minutes depending on queue.
            </p>
          </div>
        </div>
      )}

      {needsKeySelection && (
        <div className="fixed inset-0 z-[140] bg-black/90 flex items-center justify-center p-8">
          <div className="bg-white p-10 rounded-[3rem] text-slate-900 text-center space-y-6 max-w-sm animate-in zoom-in-95">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 mx-auto">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black italic tracking-tight">Paid Key Required</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide leading-relaxed">Gemini Veo requires an API Key from a billed Google Cloud project.</p>
            </div>
            <button onClick={() => { setNeedsKeySelection(false); window.aistudio.openSelectKey(); }} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg uppercase text-[11px] tracking-widest">Select Key</button>
            <button onClick={() => setNeedsKeySelection(false)} className="text-[10px] font-black uppercase text-slate-400">Cancel</button>
          </div>
        </div>
      )}

      <input type="file" ref={startInputRef} hidden accept="image/*" onChange={e => {
        const f = e.target.files?.[0];
        if (f) {
          const r = new FileReader();
          r.onloadend = () => setPhotoStart(r.result as string);
          r.readAsDataURL(f);
        }
      }} />
    </div>
  );
};

export default VideoView;
