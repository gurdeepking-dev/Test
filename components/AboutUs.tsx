
import React from 'react';

const AboutUs: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter">What We Do</h2>
        <p className="text-xl text-slate-500 font-medium">Making art easy for everyone using AI.</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 items-center bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100">
        <div className="space-y-6">
          <h3 className="text-3xl font-black text-slate-800">Who We Are</h3>
          <p className="text-slate-600 leading-relaxed">
            We are a group of friends who love art and technology. We built this store to help you make your photos look amazing with just one click.
          </p>
          <p className="text-slate-600 leading-relaxed">
            We use Google's best technology to change your photos into beautiful art pieces. It is fast, easy, and fun!
          </p>
        </div>
        <div className="aspect-square bg-rose-50 rounded-[2.5rem] flex items-center justify-center">
          <div className="w-32 h-32 bg-rose-600 rounded-3xl shadow-2xl shadow-rose-200 flex items-center justify-center text-white">
            <svg className="w-20 h-20 fill-current animate-pulse" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <h3 className="text-center text-2xl font-black text-slate-800">Why Choose Us?</h3>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { title: 'Safe & Private', desc: 'We do not keep your photos. They are used only for the magic.' },
            { title: 'Cool Styles', desc: 'Choose from many unique looks for your photos.' },
            { title: 'Great Quality', desc: 'We give you sharp, high-quality images every time.' }
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-3">
              <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 font-black">
                {i + 1}
              </div>
              <h4 className="font-black text-slate-800">{item.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
