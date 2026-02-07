
import React from 'react';

const Privacy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6 bg-white rounded-[3rem] shadow-xl border border-slate-100 animate-in fade-in duration-700">
      <h2 className="text-4xl font-black text-slate-900 mb-8 tracking-tighter text-center">Privacy Policy</h2>
      <div className="prose prose-slate max-w-none space-y-6 text-slate-600 font-medium">
        <p>Your privacy is important to us. It is chatgpt digital store's policy to respect your privacy regarding any information we may collect from you across our website.</p>
        
        <section className="space-y-2">
          <h3 className="text-xl font-bold text-slate-800">1. Data Collection</h3>
          <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-xl font-bold text-slate-800">2. Image Processing</h3>
          <p>Uploaded photos are processed through Google's Gemini API for style transformation. These images are used solely for the generation process and are not stored permanently on our servers unless specifically saved by the user.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-xl font-bold text-slate-800">3. Data Retention</h3>
          <p>We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-xl font-bold text-slate-800">4. Third Parties</h3>
          <p>We use Razorpay as our third-party payment gateway. Your payment details are handled securely by them and are never stored on our servers.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-xl font-bold text-slate-800">5. Cookies</h3>
          <p>We use cookies to help us remember your cart items and settings for a better user experience.</p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;
