
import React, { useState, useMemo } from 'react';
import { CartItem, Coupon } from '../types';
import { storageService } from '../services/storage';
import { logger } from '../services/logger';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onRemove: (id: string) => void;
  onComplete: (paymentId: string, paidItemIds: string[]) => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, cart, onRemove, onComplete }) => {
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price, 0), [cart]);
  
  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percentage') {
      return (subtotal * appliedCoupon.value) / 100;
    }
    return Math.min(appliedCoupon.value, subtotal);
  }, [subtotal, appliedCoupon]);

  const total = useMemo(() => Math.max(0, subtotal - discount), [subtotal, discount]);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCouponError(null);
    try {
      const settings = await storageService.getAdminSettings();
      const code = couponCode.toUpperCase().trim();
      const coupon = settings.coupons?.find(c => c.code === code && c.isActive);
      
      if (coupon) {
        setAppliedCoupon(coupon);
        setCouponError(null);
      } else {
        setAppliedCoupon(null);
        setCouponError("Invalid coupon code");
      }
    } catch (err) {
      setCouponError("Could not validate coupon");
    }
  };

  const handlePay = async () => {
    if (!email) {
      setError("Please type your email.");
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Handle 100% discount / Free checkout bypass
      if (total <= 0) {
        try {
          // Simulate a short delay for UX
          await new Promise(resolve => setTimeout(resolve, 800));
          onComplete(`coupon_free_${Date.now()}`, cart.map(i => i.id));
        } catch (err) {
          setError("Failed to process free checkout.");
          setIsProcessing(false);
        }
        return;
      }

      const settings = await storageService.getAdminSettings();
      const keyId = settings?.payment?.keyId || process.env.RAZORPAY_KEY_ID;

      if (!keyId) {
        setError("Something is wrong with payment. Contact support.");
        setIsProcessing(false);
        return;
      }

      if (!(window as any).Razorpay) {
        throw new Error("Internet is slow. Try again.");
      }

      const options = {
        key: keyId,
        amount: Math.round(total * 100),
        currency: settings?.payment?.currency || "INR",
        name: "chatgpt digital store",
        description: `Get ${cart.length} High-Quality Photos`,
        handler: function (response: any) {
          try {
            onComplete(response.razorpay_payment_id, cart.map(i => i.id));
          } catch (callbackErr: any) {
             alert("Paid but photos not ready. Please contact support.");
          }
        },
        prefill: { email },
        theme: { color: "#f43f5e" },
        modal: { 
          ondismiss: () => {
            setIsProcessing(false);
          } 
        }
      };

      const rzp = new (window as any).Razorpay(options);
      
      rzp.on('payment.failed', function (response: any) {
        setError("Payment failed. Try again.");
        setIsProcessing(false);
      });

      rzp.open();
    } catch (err: any) {
      setError("Something went wrong. Try again.");
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 space-y-6 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">Final Step</h4>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Get your final photos</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-600 transition-colors text-2xl font-bold">×</button>
        </div>
        
        <div className="space-y-3 max-h-40 overflow-y-auto pr-2 scrollbar-hide border-y border-slate-50 py-4">
          {cart.length > 0 ? cart.map(item => (
            <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
              <img src={item.styledImage} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt={item.styleName} />
              <div className="flex-grow">
                <p className="font-bold text-sm text-slate-800">{item.styleName}</p>
                <p className="text-[10px] text-rose-600 font-black">{storageService.getCurrencySymbol()} {item.price.toFixed(2)}</p>
              </div>
              {!isProcessing && (
                <button 
                  onClick={() => onRemove(item.id)} 
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              )}
            </div>
          )) : (
            <p className="text-center py-8 text-slate-400 italic text-sm">Cart is empty</p>
          )}
        </div>

        {/* Totals & Coupon Section */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              placeholder="Apply Coupon Code"
              className="flex-grow px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-rose-500"
              value={couponCode}
              onChange={e => setCouponCode(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleApplyCoupon()}
            />
            <button 
              onClick={handleApplyCoupon}
              className="px-6 py-3 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95"
            >
              Apply
            </button>
          </div>
          {couponError && <p className="text-[10px] font-bold text-red-500 ml-1">{couponError}</p>}
          {appliedCoupon && (
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
              <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">
                Code Applied: {appliedCoupon.code}
              </p>
              <button onClick={() => {setAppliedCoupon(null); setCouponCode('');}} className="text-green-600 text-xs font-black">✕</button>
            </div>
          )}

          <div className="space-y-2 border-t border-slate-50 pt-4">
             <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Subtotal</span>
                <span>{storageService.getCurrencySymbol()} {subtotal.toFixed(2)}</span>
             </div>
             {discount > 0 && (
               <div className="flex justify-between text-[10px] font-black text-green-600 uppercase tracking-widest">
                  <span>Discount</span>
                  <span>- {storageService.getCurrencySymbol()} {discount.toFixed(2)}</span>
               </div>
             )}
             <div className="flex justify-between text-xl font-black text-slate-900 pt-2">
                <span>Total</span>
                <span>{storageService.getCurrencySymbol()} {total.toFixed(2)}</span>
             </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Your Email (for photos)</label>
            <input 
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={isProcessing}
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-rose-500 font-medium transition-all" 
            />
          </div>
          {error && <p className="text-xs text-red-500 font-bold text-center bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}
        </div>

        <button 
          onClick={handlePay}
          disabled={cart.length === 0 || isProcessing}
          className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-black transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-3"
        >
          {isProcessing ? "Wait..." : (total <= 0 ? "Get it for FREE ✨" : `Pay ${storageService.getCurrencySymbol()} ${total.toFixed(2)}`)}
        </button>
        
        <div className="flex items-center justify-center gap-2">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Safe & Secure Payment
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
