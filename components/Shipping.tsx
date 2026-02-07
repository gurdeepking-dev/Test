
import React from 'react';

const Shipping: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6 bg-white rounded-[3rem] shadow-xl border border-slate-100 animate-in fade-in duration-700">
      <h2 className="text-4xl font-black text-slate-900 mb-8 tracking-tighter text-center">Shipping and Delivery</h2>
      <div className="prose prose-slate max-w-none space-y-6 text-slate-600 font-medium">
        <p>chatgpt digital store strictly provides digital services and products.</p>
        
        <section className="space-y-2">
          <h3 className="text-xl font-bold text-slate-800">1. Delivery Method</h3>
          <p>All products are delivered digitally through our website. Upon successful payment, the watermark on your generated image will be removed, and the high-resolution download button will be enabled instantly.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-xl font-bold text-slate-800">2. Delivery Time</h3>
          <p>Digital delivery is instantaneous following a successful transaction. In cases of high server load, AI processing might take up to 30-60 seconds.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-xl font-bold text-slate-800">3. Physical Shipping</h3>
          <p>There is no physical shipping involved. No physical prints or frames are sent to your address unless specifically stated in a separate premium package.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-xl font-bold text-slate-800">4. Notification</h3>
          <p>You will receive a payment confirmation email from our payment processor (Razorpay) which serves as your proof of purchase.</p>
        </section>
      </div>
    </div>
  );
};

export default Shipping;
