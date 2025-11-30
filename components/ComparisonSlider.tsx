import React, { useState } from 'react';
import { ChevronsLeftRight } from 'lucide-react';

interface ComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({ 
  beforeImage, 
  afterImage, 
  beforeLabel = "Your Photo", 
  afterLabel = "Reference" 
}) => {
  const [position, setPosition] = useState(50);

  return (
    <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden select-none group border border-slate-700 shadow-2xl">
      {/* Background Image (Right side / After) */}
      <img 
        src={afterImage} 
        alt="Reference" 
        className="absolute inset-0 w-full h-full object-cover" 
      />
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white font-medium border border-white/20">
        {afterLabel}
      </div>

      {/* Foreground Image (Left side / Before) - Clipped */}
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden" 
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img 
          src={beforeImage} 
          alt="Your Upload" 
          className="absolute inset-0 w-full h-full object-cover" 
        />
         <div className="absolute top-4 left-4 bg-gold-500/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-slate-900 font-bold border border-white/20">
          {beforeLabel}
        </div>
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute inset-y-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)]" 
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-slate-900 border-2 border-slate-200">
          <ChevronsLeftRight size={16} />
        </div>
      </div>

      {/* Invisible Range Input for Interaction */}
      <input 
        type="range" 
        min="0" 
        max="100" 
        value={position} 
        onChange={(e) => setPosition(Number(e.target.value))} 
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10" 
        aria-label="Comparison slider"
      />
    </div>
  );
};