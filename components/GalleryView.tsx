import React from 'react';
import { SavedScan } from '../types';
import { ArrowLeft, Trash2, Calendar } from 'lucide-react';

interface GalleryViewProps {
  scans: SavedScan[];
  onBack: () => void;
  onSelectScan: (scan: SavedScan) => void;
  onDeleteScan: (id: string, e: React.MouseEvent) => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({ 
  scans, 
  onBack, 
  onSelectScan,
  onDeleteScan 
}) => {
  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-serif text-3xl font-bold text-gold-500">My Collection</h1>
      </div>

      {scans.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
          <p className="text-slate-500 text-lg">Your collection is empty.</p>
          <p className="text-slate-600 text-sm mt-2">Identified rocks you save will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {scans.map((scan) => (
            <div 
              key={scan.id}
              onClick={() => onSelectScan(scan)}
              className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-gold-500/50 transition-all hover:shadow-lg hover:shadow-black/40 group cursor-pointer relative"
            >
              <div className="h-48 overflow-hidden relative">
                <img 
                  src={scan.imageUrl} 
                  alt={scan.analysis.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent opacity-60" />
                <button
                  onClick={(e) => onDeleteScan(scan.id, e)}
                  className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-red-500/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="p-4">
                <h3 className="font-serif font-bold text-lg text-slate-100 mb-1 truncate">{scan.analysis.name}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                  <Calendar size={12} />
                  <span>{new Date(scan.timestamp).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded border border-slate-600 ${
                    scan.analysis.economicValue === 'High' || scan.analysis.economicValue === 'Very High' 
                      ? 'text-gold-400 border-gold-900/50 bg-gold-900/10' 
                      : 'text-slate-400 bg-slate-700/50'
                  }`}>
                    {scan.analysis.economicValue} Value
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};