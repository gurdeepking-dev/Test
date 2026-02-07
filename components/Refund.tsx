
import React from 'react';

const Refund: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6 bg-white rounded-[3rem] shadow-xl border border-slate-100 animate-in fade-in duration-700">
      <h2 className="text-4xl font-black text-slate-900 mb-8 tracking-tighter text-center">Refund and Cancellation</h2>
      <div className="prose prose-slate max-w-none space-y-6 text-slate-600 font-medium">
        <p>Our goal is to ensure you are happy with your artistic transformation.</p>
        
        <section className="space-y-2">
          <h3 className="text-xl font-bold text-slate-800">1. Digital Nature of Products</h3>
          <p>Since chatgpt digital store provides non-tangible, irrevocable digital goods, we do not issue refunds once the order is completed and the high-resolution image is delivered.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-xl font-bold text-slate-800">2. Trial and Free Option</h3>
          <p>We provide every user with one free high-resolution transformation. We encourage you to use this free option to evaluate the quality of our service before making a purchase.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-xl font-bold text-slate-800">3. Cancellation</h3>
          <p>Orders for digital transformations are processed instantly. Once the payment is successful and the AI starts processing, the order cannot be cancelled.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-xl font-bold text-slate-800">4. Support</h3>
          <p>If you experience any technical issues in accessing or downloading your purchased high-res image, please contact us at support@digitalstore.ai. We will ensure the issue is resolved and you receive your file.</p>
        </section>
      </div>
    </div>
  );
};

export default Refund;
