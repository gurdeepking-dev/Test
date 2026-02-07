
import React from 'react';

interface WatermarkProps {
  text: string;
}

const Watermark: React.FC<WatermarkProps> = ({ text }) => {
  // Use the requested text instead of the prop if needed, 
  // but we'll update the caller to pass 'www.chatgptdigital.store'
  return (
    <div 
      className="absolute inset-0 z-30 pointer-events-none select-none overflow-hidden flex flex-wrap gap-12 items-center justify-center p-4 bg-transparent"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {[...Array(16)].map((_, i) => (
        <div 
          key={i} 
          className="text-white/20 text-sm sm:text-lg font-black uppercase tracking-widest whitespace-nowrap transform -rotate-45 mix-blend-overlay"
        >
          {text}
        </div>
      ))}
    </div>
  );
};

export default Watermark;