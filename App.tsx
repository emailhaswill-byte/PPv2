import React, { useState, useRef, useEffect } from 'react';
import { identifyRock } from './services/geminiService';
import { RockAnalysis, AppView, SavedScan } from './types';
import { Button } from './components/Button';
import { TipOfTheDay } from './components/TipOfTheDay';
import { ResultsView } from './components/ResultsView';
import { GalleryView } from './components/GalleryView';
import { Upload, Camera, Loader2, Image as ImageIcon, Heart, Pickaxe } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<RockAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedScans, setSavedScans] = useState<SavedScan[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved scans from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('prospector_scans');
    if (saved) {
      try {
        setSavedScans(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved scans", e);
      }
    }
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError("File is too large. Please choose an image under 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setSelectedImage(base64);
      processImage(base64);
    };
    reader.onerror = () => setError("Failed to read file.");
    reader.readAsDataURL(file);
  };

  const processImage = async (base64: string) => {
    setLoading(true);
    setView(AppView.ANALYZING);
    setError(null);
    
    try {
      const result = await identifyRock(base64);
      setAnalysis(result);
      setView(AppView.RESULTS);
    } catch (err) {
      console.error(err);
      setError("We couldn't identify this rock. Please try a clearer image or a different angle.");
      setView(AppView.HOME);
    } finally {
      setLoading(false);
    }
  };

  const saveCurrentScan = () => {
    if (!analysis || !selectedImage) return;
    
    const newScan: SavedScan = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      imageUrl: selectedImage,
      analysis: analysis
    };

    const updated = [newScan, ...savedScans];
    setSavedScans(updated);
    localStorage.setItem('prospector_scans', JSON.stringify(updated));
    
    // Also trigger native download for "Gallery" requirement as requested
    const link = document.createElement('a');
    link.href = selectedImage;
    link.download = `prospectors-pal-${analysis.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteScan = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedScans.filter(s => s.id !== id);
    setSavedScans(updated);
    localStorage.setItem('prospector_scans', JSON.stringify(updated));
  };

  const triggerUpload = () => fileInputRef.current?.click();

  const reset = () => {
    setSelectedImage(null);
    setAnalysis(null);
    setView(AppView.HOME);
    setError(null);
  };

  const openGallery = () => setView(AppView.GALLERY);
  
  const viewScanFromGallery = (scan: SavedScan) => {
    setSelectedImage(scan.imageUrl);
    setAnalysis(scan.analysis);
    setView(AppView.RESULTS);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100">
      
      {/* Navigation Bar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={reset}>
            <div className="bg-gold-500 p-1.5 rounded-lg">
              <Pickaxe className="text-slate-900" size={20} />
            </div>
            <span className="font-serif font-bold text-xl tracking-wide text-gold-500">Prospector's Pal</span>
          </div>
          <div className="flex gap-4">
             {view !== AppView.GALLERY && (
               <button onClick={openGallery} className="text-slate-400 hover:text-gold-400 transition-colors flex items-center gap-2 text-sm font-medium">
                 <ImageIcon size={18} />
                 <span className="hidden sm:inline">My Collection</span>
               </button>
             )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow p-4 md:p-8">
        
        {view === AppView.HOME && (
          <div className="max-w-2xl mx-auto animate-in fade-in zoom-in duration-500">
            <div className="text-center mb-12 mt-8">
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-slate-100 mb-4">
                Identify Rocks & <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600">Discover Value</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-lg mx-auto">
                Upload a photo of any rock or mineral. Our AI will identify it, assess its economic potential, and check for precious metal indicators.
              </p>
            </div>

            <div className="bg-slate-900 border-2 border-dashed border-slate-700 rounded-2xl p-12 text-center hover:border-gold-500/50 transition-colors group relative overflow-hidden">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept="image/*" 
                className="hidden" 
              />
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-xl shadow-black/30">
                  <Camera className="text-gold-500" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Upload a Photo</h3>
                <p className="text-slate-400 mb-8 text-sm">Tap to select or drag and drop an image</p>
                <Button onClick={triggerUpload} className="shadow-gold-900/20">
                  <Upload className="mr-2 h-4 w-4" />
                  Select Image
                </Button>
              </div>

              {/* Decorative background element */}
              <div className="absolute inset-0 bg-gradient-to-tr from-gold-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 text-center text-sm">
                {error}
              </div>
            )}

            <TipOfTheDay />
          </div>
        )}

        {view === AppView.ANALYZING && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-700">
            <div className="relative">
              <div className="absolute inset-0 bg-gold-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
              <Loader2 className="h-16 w-16 text-gold-500 animate-spin relative z-10" />
            </div>
            <h2 className="mt-8 text-2xl font-serif text-white">Analyzing Specimen...</h2>
            <p className="text-slate-400 mt-2 text-center max-w-md">
              Examining crystal structure, luster, and cleavage patterns.
            </p>
          </div>
        )}

        {view === AppView.RESULTS && analysis && selectedImage && (
          <ResultsView 
            analysis={analysis} 
            imageSrc={selectedImage} 
            onBack={reset}
            onSaveToGallery={saveCurrentScan}
          />
        )}

        {view === AppView.GALLERY && (
          <GalleryView 
            scans={savedScans} 
            onBack={() => setView(AppView.HOME)} 
            onSelectScan={viewScanFromGallery}
            onDeleteScan={deleteScan}
          />
        )}

      </main>

      {/* Footer / Donate */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Prospector's Pal. AI analysis may vary.
          </div>
          
          <a 
            href="https://www.paypal.com/donate" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-2 bg-[#003087] hover:bg-[#00256b] text-white rounded-full font-semibold transition-colors text-sm shadow-lg shadow-blue-900/20"
          >
            <Heart size={16} className="text-blue-300" />
            <span>Support the Developer</span>
          </a>
        </div>
      </footer>

    </div>
  );
};

export default App;