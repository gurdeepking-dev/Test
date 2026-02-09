
import React, { useState, useRef } from 'react';
import { geminiService } from '../services/geminiService';
import { CartItem } from '../types';

interface PhotoViewProps {
  addToCart: (item: CartItem) => void;
}

const PhotoView: React.FC<PhotoViewProps> = ({ addToCart }) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async (type: string) => {
    if (!photo) return;
    setLoading(true);
    setError(null);
    try {
      const prompt = type === 'enhance' 
        ? "Enhance the photo quality, sharpen details, improve lighting and colors while preserving identity." 
        : "Convert this photo into a hyper-realistic 8k masterpiece portrait.";
      const img = await geminiService.generateStyle(photo, prompt);
      setResult(img);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-rose-100 text-center space-y-8">
        <h2 className="text-4xl font-black text-slate-900 serif italic">Photo Enhancer <span className="text-indigo-500">Pro</span></h2>
        
        <div 
          className="aspect-square max-w-sm mx-auto bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group"
          onClick={() => inputRef.current?.click()}
        >
          {result ? (
            <img src={result} className="w-full h-full object-cover" alt="Result" />
          ) : photo ? (
            <img src={photo} className="w-full h-full object-cover" alt="Source" />
          ) : (
            <div className="space-y-4">
              <span className="text-6xl group-hover:scale-110 transition-transform block">🖼️</span>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Photo to Enhance</p>
            </div>
          )}
          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-black uppercase text-indigo-600">Improving quality...</p>
            </div>
          )}
        </div>

        <input type="file" ref={inputRef} hidden onChange={handleUpload} accept="image/*" />

        <div className="flex flex-wrap justify-center gap-4">
          <button 
            disabled={!photo || loading}
            onClick={() => handleProcess('enhance')}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
          >
            Enhance Quality ✨
          </button>
          <button 
            disabled={!photo || loading}
            onClick={() => handleProcess('masterpiece')}
            className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-black disabled:opacity-50 transition-all active:scale-95"
          >
            8K Masterpiece 💎
          </button>
        </div>

        {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
      </div>
      
      {result && (
        <div className="text-center animate-in zoom-in-95 duration-500">
          <button 
            onClick={() => {
              const link = document.createElement('a');
              link.href = result;
              link.download = 'enhanced-photo.png';
              link.click();
            }}
            className="px-12 py-5 bg-green-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-green-700 transition-all"
          >
            Download HD Photo ✅
          </button>
        </div>
      )}
    </div>
  );
};

export default PhotoView;
