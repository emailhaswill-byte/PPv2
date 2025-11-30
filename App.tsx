import React, { useState, useRef, useEffect } from 'react';
import { identifyRock } from './services/geminiService.ts';
import { RockAnalysis, AppView, SavedScan } from './types.ts';
import { Button } from './components/Button.tsx';
import { TipOfTheDay } from './components/TipOfTheDay.tsx';
import { ResultsView } from './components/ResultsView.tsx';
import { GalleryView } from './components/GalleryView.tsx';
import { Upload, Camera, Loader2, Image as ImageIcon, Heart, Pickaxe, X, Aperture, Smartphone, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<RockAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedScans, setSavedScans] = useState<SavedScan[]>([]);
  
  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
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

    // Cleanup camera on unmount
    return () => {
      stopCamera();
    };
  }, []);

  /**
   * Helper: Compresses and formats any image source to a standard JPEG
   * This fixes issues with HEIC formats, massive file sizes, and rotation.
   */
  const compressAndFormatImage = (sourceUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if too large (max 1500px)
        const MAX_SIZE = 1500;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Draw and export as JPEG
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = (e) => reject(e);
      img.src = sourceUrl;
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Basic size check (50MB hard limit to prevent browser crash, we compress anyway)
    if (file.size > 50 * 1024 * 1024) {
      setError("File is too large.");
      return;
    }

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const rawBase64 = e.target?.result as string;
      try {
        // Convert to standard JPEG before processing
        const processedImage = await compressAndFormatImage(rawBase64);
        setSelectedImage(processedImage);
        // Add a slight delay to allow UI to update before heavy AI call
        setTimeout(() => processImage(processedImage), 100);
      } catch (err) {
        console.error("Image processing failed:", err);
        setError("Could not process this image format. Please try another.");
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Failed to read file.");
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      setError(null);
      // Stop any existing stream first
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Prefer rear camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Important: play() must be called, though autoPlay usually handles it
        // Adding muted attribute in JSX is also critical for Android
        try {
            await videoRef.current.play();
        } catch (e) {
            console.error("Video play failed", e);
        }
      }
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Camera access denied:", err);
      setError("Could not access camera. Please check permissions or use 'Upload Photo' to select from your camera app.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      
      try {
        // Convert to standard format
        const rawUrl = canvas.toDataURL('image/jpeg', 0.9);
        const processedImage = await compressAndFormatImage(rawUrl);
        
        stopCamera();
        setSelectedImage(processedImage);
        processImage(processedImage);
      } catch (err) {
        setError("Failed to capture image.");
        stopCamera();
      }
    }
  };

  const processImage = async (base64: string) => {
    setLoading(true);
    setView(AppView.ANALYZING);
    setError(null);
    
    try {
      // Extract mime type if present, otherwise default to jpeg (since we compressed it)
      const mimeType = base64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/jpeg';
      const result = await identifyRock(base64, mimeType);
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
    
    // Trigger native download to ensure file is on user's device
    const link = document.createElement('a');
    link.href = selectedImage;
    link.download = `prospector-${analysis.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.jpg`;
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
    stopCamera();
    setSelectedImage(null);
    setAnalysis(null);
    setView(AppView.HOME);
    setError(null);
  };

  const openGallery = () => {
    stopCamera();
    setView(AppView.GALLERY);
  };
  
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
             {view !== AppView.GALLERY && !isCameraOpen && (
               <button onClick={openGallery} className="text-slate-400 hover:text-gold-400 transition-colors flex items-center gap-2 text-sm font-medium">
                 <ImageIcon size={18} />
                 <span className="hidden sm:inline">My Collection</span>
               </button>
             )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow p-4 md:p-8 flex flex-col relative">
        
        {/* Camera Overlay */}
        {isCameraOpen && (
          <div className="fixed inset-0 z-[60] bg-black flex flex-col">
            <div className="absolute top-4 right-4 z-20">
              <button onClick={stopCamera} className="p-3 bg-black/50 rounded-full text-white hover:bg-slate-800 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-slate-900">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline
                muted 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 pointer-events-none border-[1px] border-white/20 grid grid-cols-3 grid-rows-3">
                 {/* Grid lines for composition */}
                 <div className="border-r border-white/10 col-span-1"></div>
                 <div className="border-r border-white/10 col-span-1"></div>
                 <div className="border-r border-transparent col-span-1"></div>
                 <div className="border-b border-white/10 col-span-3 row-start-1"></div>
                 <div className="border-b border-white/10 col-span-3 row-start-2"></div>
              </div>
            </div>

            <div className="h-32 bg-black flex items-center justify-center gap-8 pb-8 pt-4">
              <button 
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/20 transition-all active:scale-95"
              >
                <div className="w-16 h-16 bg-white rounded-full"></div>
              </button>
            </div>
          </div>
        )}

        {view === AppView.HOME && !isCameraOpen && (
          <div className="max-w-4xl mx-auto w-full animate-in fade-in zoom-in duration-500">
            <div className="text-center mb-10 mt-4">
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-slate-100 mb-4">
                Identify Rocks & <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600">Discover Value</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-lg mx-auto">
                Scan rocks and minerals instantly. Our AI provides economic assessment and precious metal indicators.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {/* Option 1: Live Camera */}
              <button 
                onClick={startCamera}
                className="group relative bg-slate-900 border-2 border-slate-700 hover:border-gold-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-2xl hover:shadow-gold-900/20 overflow-hidden"
              >
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:bg-slate-800/80">
                  <Aperture className="text-gold-500" size={36} />
                </div>
                <h3 className="text-2xl font-serif font-bold text-white mb-2">Use Camera</h3>
                <p className="text-slate-400 text-sm">Take a photo directly with your device</p>
                <div className="absolute inset-0 bg-gradient-to-t from-gold-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              {/* Option 2: File Upload */}
              <button 
                onClick={triggerUpload}
                className="group relative bg-slate-900 border-2 border-slate-700 hover:border-blue-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/20 overflow-hidden"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  accept="image/*" 
                  className="hidden" 
                />
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:bg-slate-800/80">
                  <Upload className="text-blue-400" size={36} />
                </div>
                <h3 className="text-2xl font-serif font-bold text-white mb-2">Upload Photo</h3>
                <p className="text-slate-400 text-sm">Select from your gallery or files</p>
                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

            {error && (
              <div className="mb-8 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 text-center text-sm flex items-center justify-center gap-2">
                <ShieldCheck size={16} />
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
          <div className="flex flex-col h-full">
            <div className="mb-4 bg-slate-900/50 p-3 rounded-lg border border-slate-800 flex items-center gap-3 text-xs text-slate-400 mx-auto max-w-4xl w-full">
              <Smartphone size={16} className="text-green-500 shrink-0" />
              <span>
                <strong>Privacy Note:</strong> All images are stored locally on your device's browser storage. We do not upload your personal gallery to any external cloud database.
              </span>
            </div>
            <GalleryView 
              scans={savedScans} 
              onBack={() => setView(AppView.HOME)} 
              onSelectScan={viewScanFromGallery}
              onDeleteScan={deleteScan}
            />
          </div>
        )}

      </main>

      {/* Footer / Donate */}
      {!isCameraOpen && (
        <footer className="border-t border-slate-800 bg-slate-950 py-8 mt-auto z-10">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-slate-500 text-sm">
              © {new Date().getFullYear()} Prospector's Pal brought to you by MountainManMining.com
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
      )}

    </div>
  );
};

export default App;