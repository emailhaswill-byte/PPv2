import React, { useEffect, useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { TIPS_OF_THE_DAY } from '../constants';

export const TipOfTheDay: React.FC = () => {
  const [tip, setTip] = useState('');

  useEffect(() => {
    // Select a random tip on mount
    const randomTip = TIPS_OF_THE_DAY[Math.floor(Math.random() * TIPS_OF_THE_DAY.length)];
    setTip(randomTip);
  }, []);

  return (
    <div className="mt-8 mx-auto max-w-2xl bg-slate-900/50 border border-slate-800 rounded-xl p-6 relative overflow-hidden group hover:border-gold-500/30 transition-colors">
      <div className="absolute top-0 left-0 w-1 h-full bg-gold-500/50"></div>
      <div className="flex items-start gap-4">
        <div className="p-3 bg-gold-500/10 rounded-lg text-gold-500 shrink-0">
          <Lightbulb size={24} />
        </div>
        <div>
          <h3 className="font-serif text-lg font-semibold text-gold-400 mb-1">Prospector's Tip</h3>
          <p className="text-slate-300 leading-relaxed text-sm md:text-base">
            {tip}
          </p>
        </div>
      </div>
    </div>
  );
};