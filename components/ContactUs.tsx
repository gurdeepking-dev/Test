
import React, { useState } from 'react';

const ContactUs: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("Hi, I need help with chatgpt digital store.");
    window.open(`https://wa.me/919971778383?text=${message}`, '_blank');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const subject = encodeURIComponent(`Question from ${formData.name}`);
    const body = encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`);
    const mailtoLink = `mailto:gurdeepking@gmail.com?subject=${subject}&body=${body}`;
    
    window.location.href = mailtoLink;
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto py-16 px-6 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter serif italic">Need Help?</h2>
        <p className="text-xl text-slate-500 font-medium">Ask us anything. We are here to help!</p>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-rose-100 space-y-6">
            <h3 className="text-2xl font-black text-slate-800">Contact Us</h3>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Us</p>
                  <a href="mailto:gurdeepking@gmail.com" className="text-slate-800 font-bold hover:text-rose-600 transition-colors break-all">gurdeepking@gmail.com</a>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Call Us</p>
                  <a href="tel:+919971778383" className="text-slate-800 font-bold hover:text-rose-600 transition-colors">+91 99717 78383</a>
                </div>
              </div>

              <button 
                onClick={handleWhatsAppClick}
                className="w-full py-4 bg-[#25D366] text-white rounded-2xl font-black shadow-lg hover:shadow-xl hover:bg-[#20ba5a] transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                Chat on WhatsApp
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-7">
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-rose-100">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Your Name</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-rose-500 font-medium" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                    <input 
                      type="email" 
                      required 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-rose-500 font-medium" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Your Message</label>
                  <textarea 
                    required 
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-rose-500 h-32 resize-none font-medium" 
                    placeholder="Tell us how we can help..."
                  ></textarea>
                </div>
                <button type="submit" className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black shadow-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-2">
                  Send Message
                </button>
              </form>
            ) : (
              <div className="py-20 text-center space-y-6 animate-in zoom-in-95 duration-500">
                <h4 className="text-2xl font-black text-slate-800 italic">Message Sent!</h4>
                <p className="text-slate-500 font-medium">We will get back to you soon.</p>
                <button onClick={() => setSubmitted(false)} className="py-3 text-rose-500 font-bold hover:underline">
                  Go Back
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
