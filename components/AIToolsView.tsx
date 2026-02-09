
import React, { useState } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";

const AIToolsView: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'audio' | 'watermark' | 'bg-remover' | 'face-swap'>('audio');
  
  // Audio Studio State
  const [text, setText] = useState('Hello! I am your AI assistant. How can I transform your digital world today?');
  const [voice, setVoice] = useState('Kore');
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // General Tool States
  const [sourceImage, setSourceImage] = useState<string | null>(null);

  const generateTTS = async () => {
    setLoading(true);
    setAudioUrl(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Generate clear, natural speech in the original language of this text: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
        
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const dataInt16 = new Int16Array(bytes.buffer);
        const buffer = audioCtx.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
        
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start();
        setAudioUrl('generated'); 
      }
    } catch (err: any) {
      alert("Voice Studio Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toolCards = [
    { id: 'audio', label: 'Audio Studio', desc: 'Neural TTS Engine', icon: '🎵', color: 'rose' },
    { id: 'watermark', label: 'Magic Eraser', desc: 'Object Removal', icon: '🪄', color: 'violet' },
    { id: 'bg-remover', label: 'BG Extractor', desc: 'Layer Cutouts', icon: '✂️', color: 'blue' },
    { id: 'face-swap', label: 'Deep Swap', desc: 'Persona Morphing', icon: '🎭', color: 'amber' }
  ];

  const getColorClasses = (color: string, active: boolean) => {
    const colors: Record<string, string> = {
      rose: active ? 'bg-white border-rose-500 shadow-2xl shadow-rose-100' : 'bg-white/50 border-rose-50 hover:bg-white hover:border-rose-200',
      violet: active ? 'bg-white border-violet-500 shadow-2xl shadow-violet-100' : 'bg-white/50 border-violet-50 hover:bg-white hover:border-violet-200',
      blue: active ? 'bg-white border-blue-500 shadow-2xl shadow-blue-100' : 'bg-white/50 border-blue-50 hover:bg-white hover:border-blue-200',
      amber: active ? 'bg-white border-amber-500 shadow-2xl shadow-amber-100' : 'bg-white/50 border-amber-50 hover:bg-white hover:border-amber-200',
    };
    return colors[color] || '';
  };

  const getIconClasses = (color: string, active: boolean) => {
    const colors: Record<string, string> = {
      rose: active ? 'bg-rose-500 text-white shadow-xl rotate-12' : 'bg-rose-50 text-rose-400 group-hover:rotate-6',
      violet: active ? 'bg-violet-500 text-white shadow-xl -rotate-12' : 'bg-violet-50 text-violet-400 group-hover:-rotate-6',
      blue: active ? 'bg-blue-500 text-white shadow-xl rotate-6' : 'bg-blue-50 text-blue-400 group-hover:rotate-3',
      amber: active ? 'bg-amber-500 text-white shadow-xl -rotate-6' : 'bg-amber-50 text-amber-400 group-hover:-rotate-3',
    };
    return colors[color] || '';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* Tool Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        {toolCards.map(tool => (
          <div 
            key={tool.id}
            onClick={() => setActiveTool(tool.id as any)}
            className={`group cursor-pointer p-8 rounded-[3rem] border-2 transition-all duration-500 flex items-center gap-6 ${getColorClasses(tool.color, activeTool === tool.id)}`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500 flex-shrink-0 ${getIconClasses(tool.color, activeTool === tool.id)}`}>
              {tool.icon}
            </div>
            <div className="text-left">
              <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase tracking-widest">{tool.label}</h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{tool.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tool Display Area */}
      <div className="bg-white rounded-[4rem] p-12 shadow-2xl border border-slate-100 min-h-[600px] animate-in slide-in-from-bottom-4 duration-500 mx-4">
        {activeTool === 'audio' ? (
          <div className="max-w-4xl mx-auto space-y-12 text-center">
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-slate-900 serif italic tracking-tight">AI Multi-Voice <span className="text-rose-500">Studio</span></h2>
              <p className="text-slate-400 font-bold uppercase text-[11px] tracking-[0.3em]">Transform Hindi, Punjabi, and English text into natural neural speech</p>
            </div>

            <div className="space-y-10">
              <div className="relative group">
                <textarea 
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-[3rem] p-10 text-slate-800 text-lg font-semibold focus:ring-8 focus:ring-rose-500/5 focus:border-rose-500 outline-none h-64 resize-none transition-all shadow-inner placeholder:text-slate-300"
                  placeholder="Type your message in any language..."
                />
                <div className="absolute bottom-8 right-10 text-[10px] font-black text-rose-400 uppercase tracking-widest bg-white px-4 py-1.5 rounded-full shadow-sm border border-rose-50">
                  {text.length} Characters
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-left ml-4">Select Neural Persona</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr', 'Kore-2', 'Puck-2', 'Fenrir-2'].map(v => (
                    <button 
                      key={v}
                      onClick={() => setVoice(v)}
                      className={`py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all duration-500 flex flex-col items-center gap-2 ${voice === v ? 'bg-slate-900 text-white border-slate-900 shadow-xl -translate-y-1 scale-105' : 'bg-white text-slate-400 border-slate-100 hover:border-rose-300'}`}
                    >
                      <span className="text-xl">{v.includes('Puck') || v.includes('Fenrir') ? '👩' : '👨'}</span>
                      {v.replace('-2', ' v2')}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                disabled={loading || !text}
                onClick={generateTTS}
                className="w-full py-7 bg-rose-600 text-white rounded-[2.5rem] font-black text-2xl uppercase tracking-[0.2em] shadow-2xl shadow-rose-900/10 hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-50 border-b-8 border-rose-800"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Synthesizing...</span>
                  </div>
                ) : 'Synthesize Audio 🎙️'}
              </button>
              
              {audioUrl && (
                <div className="p-6 bg-green-50 rounded-3xl border border-green-100 animate-in zoom-in-95 duration-500 flex items-center justify-center gap-4">
                   <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-xl animate-pulse">🔊</div>
                   <p className="text-green-600 font-black text-[11px] uppercase tracking-widest">
                     Audio Stream Optimized & Playing
                   </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-10 text-center flex flex-col items-center">
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-slate-900 serif italic">
                AI {activeTool === 'watermark' ? 'Magic Eraser' : activeTool === 'bg-remover' ? 'Background Extractor' : 'Deep Swap'}
              </h2>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                Professional Visual Processing Tools
              </p>
            </div>
            
            <div 
              className="w-full max-w-md aspect-square bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center group cursor-pointer hover:bg-slate-100 transition-all duration-500 shadow-inner"
              onClick={() => document.getElementById('tool-img-upload')?.click()}
            >
              {sourceImage ? (
                <img src={sourceImage} className="w-full h-full object-cover rounded-[2rem] shadow-2xl" alt="Preview" />
              ) : (
                <div className="space-y-6">
                  <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-5xl shadow-2xl group-hover:scale-110 transition-transform">
                    {activeTool === 'watermark' ? '🪄' : activeTool === 'bg-remover' ? '✂️' : '🎭'}
                  </div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-relaxed">Import HD Source<br/>to begin processing</p>
                </div>
              )}
            </div>
            <input id="tool-img-upload" type="file" hidden onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                 const r = new FileReader();
                 r.onloadend = () => setSourceImage(r.result as string);
                 r.readAsDataURL(file);
              }
            }} />

            <div className="p-10 bg-rose-50/50 rounded-[2.5rem] border border-rose-100 max-w-lg">
              <p className="text-xs font-bold text-rose-600 leading-relaxed italic">
                "Our neural network will perform pixel-perfect {activeTool === 'watermark' ? ' object removal' : activeTool === 'bg-remover' ? ' layer separation' : ' feature alignment'} based on high-frequency feature maps."
              </p>
            </div>

            <button className="px-12 py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-base uppercase tracking-widest shadow-2xl opacity-40 cursor-not-allowed">
              Deployment in Progress 🚀
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIToolsView;
