
import React, { useState, useRef, useEffect } from 'react';
import { ViewType } from '../types';

interface HeaderProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  cartCount: number;
  onOpenCheckout: () => void;
  user: any; 
  onLoginClick: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  currentView, setView, cartCount, onOpenCheckout
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNav = (v: ViewType) => {
    setView(v);
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-rose-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleNav('valentine')}>
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0">
             <div className="absolute inset-0 bg-rose-500 rounded-full rotate-12 group-hover:scale-110 transition-all duration-500 shadow-xl opacity-20"></div>
             <div className="absolute inset-0 bg-gradient-to-tr from-rose-500 to-pink-500 rounded-xl sm:rounded-2xl rotate-6 group-hover:rotate-12 transition-all duration-500 shadow-lg"></div>
             <div className="absolute inset-0 bg-white rounded-xl sm:rounded-2xl border-2 border-rose-500 flex items-center justify-center -rotate-3 group-hover:rotate-0 transition-all duration-500">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-rose-500 fill-current animate-pulse" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
             </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg sm:text-2xl font-black bg-gradient-to-br from-rose-600 via-rose-500 to-pink-400 bg-clip-text text-transparent leading-none tracking-tight serif italic">
              chatgpt digital store
            </h1>
            <p className="text-[10px] sm:text-[11px] font-black text-rose-500 uppercase tracking-[0.1em] mt-1">Art & Video Studio ✨</p>
          </div>
        </div>

        <nav className="flex items-center gap-2 sm:gap-6">
          <button 
            onClick={onOpenCheckout}
            className="relative p-2.5 sm:p-3 bg-white border border-rose-100 rounded-xl sm:rounded-2xl shadow-sm text-rose-600 hover:text-rose-700 transition-all hover:shadow-md active:scale-95"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] sm:text-[10px] font-black w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full animate-bounce ring-2 sm:ring-4 ring-white">
                {cartCount}
              </span>
            )}
          </button>

          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2.5 sm:p-3 bg-rose-600 text-white rounded-xl sm:rounded-2xl shadow-xl hover:bg-rose-700 transition-all active:scale-95"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-4 w-64 bg-white rounded-[2.5rem] shadow-2xl border border-rose-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="p-3 space-y-1">
                  <div className="px-5 py-2 mb-2 border-b border-rose-50">
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Main Studios</p>
                  </div>
                  <button onClick={() => handleNav('valentine')} className={`w-full text-left px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${currentView === 'valentine' ? 'bg-rose-50 text-rose-600' : 'text-slate-600 hover:bg-rose-50'}`}>💖 Valentine Special</button>
                  <button onClick={() => handleNav('video')} className={`w-full text-left px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${currentView === 'video' ? 'bg-rose-50 text-rose-600' : 'text-slate-600 hover:bg-rose-50'}`}>🎬 AI Video Studio</button>
                  <button onClick={() => handleNav('photo')} className={`w-full text-left px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${currentView === 'photo' ? 'bg-rose-50 text-rose-600' : 'text-slate-600 hover:bg-rose-50'}`}>🖼️ Photo Enhancer</button>
                  <button onClick={() => handleNav('aitools')} className={`w-full text-left px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${currentView === 'aitools' ? 'bg-rose-50 text-rose-600' : 'text-slate-600 hover:bg-rose-50'}`}>🛠️ All AI Tools</button>
                  
                  <div className="h-px bg-rose-50 mx-5 my-2" />
                  <div className="px-5 py-2">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Information</p>
                  </div>
                  <button onClick={() => handleNav('about')} className="w-full text-left px-5 py-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-rose-50">Who We Are</button>
                  <button onClick={() => handleNav('contact')} className="w-full text-left px-5 py-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-rose-50">Need Help?</button>
                  <div className="h-px bg-rose-50 mx-5 my-2" />
                  <button onClick={() => handleNav('admin')} className={`w-full text-left px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentView === 'admin' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-600 hover:bg-rose-50'}`}>Admin Panel</button>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
