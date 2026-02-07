
import React from 'react';

const Terms: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6 bg-white rounded-[3rem] shadow-xl border border-slate-100 animate-in fade-in duration-700">
      <h2 className="text-4xl font-black text-slate-900 mb-8 tracking-tighter text-center">Terms and Conditions</h2>
      <div className="prose prose-slate max-w-none space-y-6 text-slate-600 font-medium">
        <p>Welcome to chatgpt digital store. By using our website, you agree to comply with and be bound by the following terms and conditions of use.</p>
        
        <section className="space-y-2">
          <h3 className="text-xl font-bold text-slate-800">1. Acceptance of Terms</h3>
          <p>By accessing this website, you are agreeing to be bound by these web site Terms and Conditions of Use, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-xl font-bold text-slate-800">2. Use License</h3>
          <p>Permission is granted to temporarily download one copy of the materials (information or software) on chatgpt digital store's web site for personal, non-commercial transitory viewing only.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-xl font-bold text-slate-800">3. Disclaimer</h3>
          <p>The materials on chatgpt digital store's web site are provided "as is". chatgpt digital store makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties, including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-xl font-bold text-slate-800">4. Service Limitations</h3>
          <p>chatgpt digital store uses AI models to generate images. We do not guarantee the perfection of results. The output is a digital artistic representation based on the user's input photo.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-xl font-bold text-slate-800">5. Governing Law</h3>
          <p>Any claim relating to chatgpt digital store's web site shall be governed by the laws of India without regard to its conflict of law provisions.</p>
        </section>
      </div>
    </div>
  );
};

export default Terms;
