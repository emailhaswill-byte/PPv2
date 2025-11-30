import React, { useState, useEffect } from 'react';
import { RockAnalysis, AlternativeRock } from '../types.ts';
import { Button } from './Button.tsx';
import { ComparisonSlider } from './ComparisonSlider.tsx';
import { 
  ArrowLeft, 
  DollarSign, 
  Pickaxe, 
  AlertCircle, 
  ExternalLink,
  Save,
  Check,
  Target,
  Camera,
  ImageOff
} from 'lucide-react';

interface ResultsViewProps {
  analysis: RockAnalysis;
  imageSrc: string;
  onBack: () => void;
  onSaveToGallery: () => void;
}

// Custom hook to fetch Wikipedia images
const useWikiImage = (queryName: string | undefined) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!queryName) return;

    const fetchImage = async () => {
      setLoading(true);
      try {
        // First try exact match
        let response = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(queryName)}&prop=pageimages&format=json&pithumbsize=600&origin=*`
        );
        let data = await response.json();
        let pages = data.query?.pages;
        let pageId = Object.keys(pages)[0];
        
        // If no image found, try searching for the term to get a better page title
        if (pageId === '-1' || !pages[pageId]?.thumbnail) {
             const searchResp = await fetch(
                `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(queryName)}&limit=1&namespace=0&format=json&origin=*`
             );
             const searchData = await searchResp.json();
             const bestMatch = searchData[1]?.[0];
             
             if (bestMatch) {
                 response = await fetch(
                    `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(bestMatch)}&prop=pageimages&format=json&pithumbsize=600&origin=*`
                  );
                  data = await response.json();
                  pages = data.query?.pages;
                  pageId = Object.keys(pages)[0];
             }
        }

        if (pages && pageId !== '-1') {
          const url = pages[pageId]?.thumbnail?.source;
          if (url) {
            setImageUrl(url);
          }
        }
      } catch (e) {
        console.error(`Failed to fetch wiki image for ${queryName}`, e);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [queryName]);

  return { imageUrl, loading };
};

// Sub-component for rendering alternative cards with their own image fetcher
const AlternativeRockCard: React.FC<{ alt: AlternativeRock; idx: number }> = ({ alt, idx }) => {
  const { imageUrl, loading } = useWikiImage(alt.name);

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex gap-4 hover:border-slate-500 transition-colors">
      <div className="w-20 h-20 shrink-0 bg-slate-700 rounded-lg overflow-hidden relative border border-slate-600">
         {loading ? (
           <div className="w-full h-full animate-pulse bg-slate-600" />
         ) : imageUrl ? (
           <img 
            src={imageUrl} 
            alt={alt.name} 
            className="w-full h-full object-cover"
          />
         ) : (
           <div className="w-full h-full flex items-center justify-center text-slate-500">
             <ImageOff size={20} />
           </div>
         )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-bold text-slate-200 truncate pr-2">{alt.name}</h4>
          <a 
            href={alt.wikiUrl} 
            target="_blank" 
            rel="noreferrer"
            className="text-gold-500 hover:text-gold-400 p-1"
            title="View on Wikipedia"
          >
            <ExternalLink size={16} />
          </a>
        </div>
        <p className="text-xs text-slate-400 line-clamp-2">
          {alt.description}
        </p>
      </div>
    </div>
  );
};

export const ResultsView: React.FC<ResultsViewProps> = ({ 
  analysis, 
  imageSrc, 
  onBack,
  onSaveToGallery
}) => {
  const [saved, setSaved] = useState(false);
  
  // Fetch main reference image
  const { imageUrl: referenceImage } = useWikiImage(analysis.name);

  const handleSave = () => {
    onSaveToGallery();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const economicColor = {
    'Low': 'text-slate-400',
    'Moderate': 'text-blue-400',
    'High': 'text-gold-400',
    'Very High': 'text-green-400'
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header / Back */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={onBack}
          className="flex items-center text-slate-400 hover:text-white transition-colors gap-2"
        >
          <ArrowLeft size={20} />
          <span>Back to Scanner</span>
        </button>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleSave} 
            className="!py-2 !px-4 text-sm"
            disabled={saved}
          >
            {saved ? <Check size={16} className="mr-2" /> : <Save size={16} className="mr-2" />}
            {saved ? 'Saved' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Visuals */}
        <div className="space-y-6">
          
          {/* Main Visual Component - Toggle between single view or slider if ref exists */}
          {referenceImage ? (
            <div className="space-y-2">
               <ComparisonSlider 
                 beforeImage={imageSrc} 
                 afterImage={referenceImage} 
                 beforeLabel="Your Find" 
                 afterLabel={`Typical ${analysis.name}`}
               />
               <p className="text-center text-xs text-slate-500">
                 Drag the slider to compare your rock with a typical specimen.
               </p>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-slate-700 bg-slate-900 group">
              <img 
                src={imageSrc} 
                alt="Analyzed Rock" 
                className="w-full h-80 md:h-96 object-cover transform group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-6">
                <h1 className="font-serif text-3xl text-white font-bold mb-1">{analysis.name}</h1>
                <p className="text-slate-300 italic text-sm">{analysis.scientificName}</p>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm">
            <h3 className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-4">Economic Assessment</h3>
            
            <div className="flex items-center gap-4 mb-6">
              <div className={`p-3 rounded-full bg-slate-800 border border-slate-700 shrink-0 ${economicColor[analysis.economicValue]}`}>
                <DollarSign size={24} />
              </div>
              <div>
                <span className="block text-slate-400 text-xs">Potential Value</span>
                <span className={`text-xl font-bold ${economicColor[analysis.economicValue]}`}>
                  {analysis.economicValue}
                </span>
              </div>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              {analysis.economicDetails}
            </p>

            <div className="border-t border-slate-700 pt-6">
              <h4 className="flex items-center gap-2 text-gold-400 font-semibold mb-3">
                <Pickaxe size={16} />
                <span>Associated Metals</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.associatedMetals.length > 0 ? (
                  analysis.associatedMetals.map((metal, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-700 text-slate-200 text-xs rounded-full border border-slate-600">
                      {metal}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-sm italic">No significant metal associations</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Analysis Details */}
        <div className="space-y-6">
          
          <div className="bg-slate-900/50 rounded-2xl p-8 border border-slate-800">
            <div className="flex items-start justify-between mb-4">
              <h2 className="font-serif text-2xl text-gold-500">Analysis</h2>
              
              {/* Confidence Meter */}
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 mb-1">
                  <Target size={14} className="text-slate-400" />
                  <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Confidence</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${getConfidenceColor(analysis.confidence)} transition-all duration-1000`} 
                      style={{ width: `${analysis.confidence}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-200">{analysis.confidence}%</span>
                </div>
              </div>
            </div>

            <p className="text-slate-300 leading-relaxed text-lg">
              {analysis.description}
            </p>
            
            {analysis.containsPreciousMetals && (
              <div className="mt-6 p-4 bg-gold-900/20 border border-gold-500/30 rounded-lg flex items-start gap-3">
                <AlertCircle className="text-gold-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-semibold text-gold-400 text-sm">Prospector Note</h4>
                  <p className="text-gold-200/80 text-xs mt-1">
                    This mineral is a known indicator for precious metals. Check the surrounding area carefully.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Alternatives Section */}
          <div className="pt-8 border-t border-slate-800">
            <h3 className="font-serif text-xl text-slate-200 mb-4 flex items-center gap-2">
              <span className="text-slate-500">Not what you're looking for?</span>
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Identification can be tricky. Here are two other possibilities that look similar:
            </p>

            <div className="grid gap-4">
              {analysis.alternatives.map((alt, idx) => (
                <AlternativeRockCard key={idx} alt={alt} idx={idx} />
              ))}
            </div>
          </div>
          
          {/* Scan Another Button */}
          <div className="pt-6">
            <Button 
              variant="primary" 
              fullWidth 
              onClick={onBack}
              className="py-4 shadow-xl shadow-gold-900/20 group"
            >
              <Camera className="mr-2 transition-transform group-hover:scale-110" size={20} />
              Scan Another Specimen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};