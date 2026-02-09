
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ValentineView from './components/ValentineView';
import PhotoView from './components/PhotoView';
import VideoView from './components/VideoView';
import AIToolsView from './components/AIToolsView';
import AdminView from './components/AdminView';
import AboutUs from './components/AboutUs';
import ContactUs from './components/ContactUs';
import Terms from './components/Terms';
import Privacy from './components/Privacy';
import Refund from './components/Refund';
import Shipping from './components/Shipping';
import { CartItem, ViewType } from './types';
import { analytics } from './services/analytics';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('valentine');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  useEffect(() => {
    analytics.init();
  }, []);

  const addToCart = (item: CartItem) => {
    setCart(prev => [...prev, item]);
    analytics.track('AddToCart', { 
      content_name: item.styleName,
      value: item.price,
      currency: 'INR'
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const renderContent = () => {
    switch(currentView) {
      case 'admin': return <AdminView />;
      case 'about': return <AboutUs />;
      case 'contact': return <ContactUs />;
      case 'terms': return <Terms />;
      case 'privacy': return <Privacy />;
      case 'refund': return <Refund />;
      case 'shipping': return <Shipping />;
      case 'photo': return <PhotoView addToCart={addToCart} />;
      case 'video': return <VideoView />;
      case 'aitools': return <AIToolsView />;
      case 'valentine':
      default:
        return (
          <ValentineView 
            cart={cart}
            setCart={setCart}
            user={null}
            addToCart={addToCart}
            showCheckout={showCheckoutModal}
            setShowCheckout={setShowCheckoutModal}
            removeFromCart={removeFromCart}
            onLoginRequired={() => {}}
            onUserUpdate={() => {}}
          />
        );
    }
  };

  const isMainTab = ['valentine', 'video', 'photo', 'aitools'].includes(currentView);

  return (
    <div className="min-h-screen flex flex-col bg-rose-50/30">
      <Header 
        currentView={currentView}
        setView={(v) => setCurrentView(v)}
        cartCount={cart.length}
        onOpenCheckout={() => {
          setShowCheckoutModal(true);
          analytics.track('InitiateCheckout');
        }}
        user={null}
        onLoginClick={() => {}}
        onLogout={() => {}}
      />
      
      {isMainTab && (
        <div className="container mx-auto px-4 mt-8 flex justify-center sticky top-24 z-40">
          <div className="bg-white/80 backdrop-blur-xl p-1.5 rounded-[2.5rem] shadow-2xl border border-rose-100/50 flex gap-1 w-full max-w-xl transition-all duration-500">
            {[
              { id: 'valentine', label: 'Valentine', icon: '💖' },
              { id: 'video', label: 'Video', icon: '🎬' },
              { id: 'photo', label: 'Photo', icon: '🖼️' },
              { id: 'aitools', label: 'AI Tools', icon: '🛠️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentView(tab.id as ViewType)}
                className={`flex-1 py-3.5 px-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all duration-700 flex items-center justify-center gap-2 relative overflow-hidden group ${
                  currentView === tab.id 
                  ? 'text-white scale-[1.05]' 
                  : 'text-slate-400 hover:text-rose-500'
                }`}
              >
                {currentView === tab.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-500 animate-in fade-in zoom-in duration-500"></div>
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="flex-grow container mx-auto px-4 py-8">
        {renderContent()}
      </main>

      <footer className="bg-white border-t py-12 text-center text-slate-500 text-sm">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center gap-8">
          <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-12">
            <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-6 text-[10px] uppercase tracking-widest font-black text-slate-400">
            <button onClick={() => setCurrentView('valentine')} className="hover:text-rose-600 transition-colors">Home</button>
            <button onClick={() => setCurrentView('about')} className="hover:text-rose-600 transition-colors">Who We Are</button>
            <button onClick={() => setCurrentView('contact')} className="hover:text-rose-600 transition-colors">Need Help?</button>
            <button onClick={() => setCurrentView('terms')} className="hover:text-rose-600 transition-colors">Rules</button>
            <button onClick={() => setCurrentView('privacy')} className="hover:text-rose-600 transition-colors">Privacy</button>
            <button onClick={() => setCurrentView('refund')} className="hover:text-rose-600 transition-colors">Refunds</button>
            <button onClick={() => setCurrentView('shipping')} className="hover:text-rose-600 transition-colors">Delivery</button>
          </div>

          <div className="h-px w-24 bg-slate-100" />
          
          <div className="space-y-2">
            <p className="font-bold text-slate-900 uppercase">chatgpt digital store</p>
            <p className="text-[10px] font-medium max-w-lg mx-auto leading-relaxed">
              Premium AI Art, Video & Audio Studio.
            </p>
            <p className="pt-4 text-xs font-bold text-slate-400">&copy; {new Date().getFullYear()} All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
