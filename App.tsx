
import React, { useState, useEffect, useRef } from 'react';
import { Layers, Wand2, ChevronRight, LayoutTemplate, History as HistoryIcon, PlayCircle, Settings2, X } from 'lucide-react';
import { Dropzone } from './components/Dropzone';
import { VideoComparison } from './components/VideoComparison';
import { ProcessingOverlay } from './components/ProcessingOverlay';
import { AppStatus, MediaType, HistoryItem } from './types';
import { MOCK_RESULT_VIDEO } from './constants';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  
  // File State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Hidden feature state
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const [customResultVideo, setCustomResultVideo] = useState<string | null>(null);
  const [customProcessingDuration, setCustomProcessingDuration] = useState<number | null>(null);
  
  // Config Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [pendingResultUrl, setPendingResultUrl] = useState<string | null>(null);
  const [tempDuration, setTempDuration] = useState<string>('10');

  // Helper to simulate upload
  const simulateUpload = (
    file: File, 
    setFile: (f: File) => void, 
    setPreview: (url: string) => void,
    setUploading: (b: boolean) => void,
    setProgress: (n: number) => void
  ) => {
    setUploading(true);
    setProgress(0);
    setFile(file); // Set file immediately to show name in UI
    
    // Create URL immediately but Dropzone will hide it until upload completes
    const url = URL.createObjectURL(file);
    setPreview(url);

    let currentProgress = 0;
    // Faster simulation for images, slower for videos (fake realism)
    const increment = file.type.startsWith('video') ? 2 : 5; 
    const intervalTime = 50;

    const interval = setInterval(() => {
      currentProgress += Math.random() * increment;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setUploading(false);
        }, 400); // Short delay at 100% for smooth UX
      }
      setProgress(currentProgress);
    }, intervalTime);
  };

  // Handlers
  const handleVideoSelect = (file: File) => {
    simulateUpload(
      file, 
      setVideoFile, 
      setVideoPreview, 
      setIsUploadingVideo, 
      setVideoProgress
    );
  };

  const handleImageSelect = (file: File) => {
    simulateUpload(
      file, 
      setImageFile, 
      setImagePreview, 
      setIsUploadingImage, 
      setImageProgress
    );
  };

  // Hidden Feature Handlers
  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hiddenInputRef.current) {
      hiddenInputRef.current.click();
    }
  };

  const handleHiddenFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      
      // Store pending state and open modal
      setPendingResultUrl(url);
      setTempDuration('10'); // Reset to default suggestion
      setShowConfigModal(true);
    }
    // Reset input
    e.target.value = '';
  };

  const confirmConfig = () => {
    if (pendingResultUrl) {
      setCustomResultVideo(pendingResultUrl);
      const seconds = parseFloat(tempDuration);
      if (!isNaN(seconds) && seconds > 0) {
        setCustomProcessingDuration(seconds * 1000);
      } else {
        setCustomProcessingDuration(null);
      }
      setShowConfigModal(false);
      setPendingResultUrl(null);
    }
  };

  const cancelConfig = () => {
    setShowConfigModal(false);
    setPendingResultUrl(null);
  };

  const clearVideo = () => {
    if (isUploadingVideo) return;
    setVideoFile(null);
    setVideoPreview(null);
    setVideoProgress(0);
  };

  const clearImage = () => {
    if (isUploadingImage) return;
    setImageFile(null);
    setImagePreview(null);
    setImageProgress(0);
  };

  const startProcessing = () => {
    if (!videoFile || !imageFile) return;
    setStatus(AppStatus.PROCESSING);
  };

  const resultVideoSrc = customResultVideo || MOCK_RESULT_VIDEO;

  const handleProcessingComplete = () => {
    // Save to history before showing result
    if (videoPreview && imagePreview) {
      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        sourceVideoUrl: videoPreview,
        insertedImageUrl: imagePreview,
        resultVideoUrl: resultVideoSrc,
        sourceFileName: videoFile?.name || 'Unknown Video',
        imageFileName: imageFile?.name || 'Unknown Image'
      };
      setHistory(prev => [newItem, ...prev]);
    }
    setStatus(AppStatus.COMPLETED);
  };

  const restoreHistoryItem = (item: HistoryItem) => {
    setVideoPreview(item.sourceVideoUrl);
    setCustomResultVideo(item.resultVideoUrl); // Use the result stored in history (or active mock)
    // We don't necessarily have the 'File' objects anymore, so we just set previews
    // This allows the comparison view to work.
    setStatus(AppStatus.COMPLETED);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetAll = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setImageFile(null);
    setImagePreview(null);
    setVideoProgress(0);
    setImageProgress(0);
    setStatus(AppStatus.IDLE);
    // Note: We deliberately do NOT reset customResultVideo so the demo persists until reload
  };

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      // Don't revoke URLs that are in history, or they will break
      // In a real app we'd manage blob lifecycle better or use a backend.
      if (customResultVideo) URL.revokeObjectURL(customResultVideo);
    };
  }, []);

  const isReadyToProcess = videoFile && !isUploadingVideo && imageFile && !isUploadingImage;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 pb-20">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Hidden Input for God Mode */}
      <input 
        type="file" 
        ref={hiddenInputRef} 
        className="hidden" 
        accept="video/*" 
        onChange={handleHiddenFileChange}
      />

      {/* Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings2 size={20} className="text-indigo-400" />
                Simulation Settings
              </h3>
              <button onClick={cancelConfig} className="text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">Total Processing Time</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={tempDuration}
                  onChange={(e) => setTempDuration(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 pr-12 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="e.g. 10"
                  min="1"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">sec</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                 The 3 phases (Choosing spot, Detecting occlusion, Diffusion) will automatically scale to fit this duration.
              </p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={cancelConfig}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmConfig}
                className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 font-medium transition-colors shadow-lg shadow-indigo-500/20"
              >
                Confirm Setup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-slate-950/50 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4 group select-none">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 bg-gradient-to-br from-indigo-600 to-violet-600 shadow-indigo-500/20">
              <Layers className="text-white" size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight leading-none">ADSPA</h1>
                <button 
                  onClick={handleSettingsClick}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-slate-800 text-slate-600 hover:text-indigo-400"
                  title="Configure Simulation Result"
                >
                  <Settings2 size={14} />
                </button>
              </div>
              <p className="text-xs text-slate-500 font-medium tracking-wide mt-1 max-w-[200px] leading-tight">
                Adaptive Diffusion-based Spatial Placement for Advertisement
              </p>
            </div>
          </div>
          
          {status === AppStatus.COMPLETED && (
            <button 
              onClick={resetAll}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors border border-slate-700 hover:border-slate-600 shadow-lg"
            >
              Start New Project
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        
        {/* PROCESSING OVERLAY */}
        {status === AppStatus.PROCESSING && (
          <ProcessingOverlay 
            onComplete={handleProcessingComplete} 
            totalDurationOverride={customProcessingDuration}
          />
        )}

        {/* INPUT STAGE */}
        {status === AppStatus.IDLE && (
          <div className="space-y-12 animate-fade-in-up">
            
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                Contextual Ad Insertion <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Powered by Diffusion</span>
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                Seamlessly integrate branded assets into video content. 
                Our adaptive engine detects surfaces, lighting, and occlusion for photorealistic placement.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Step 1: Video Source */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2 px-1">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold border border-slate-700">1</div>
                  <span className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Source Footage</span>
                </div>
                <Dropzone 
                  type={MediaType.VIDEO}
                  label="Upload Video"
                  subLabel="MP4, MOV (Max 100MB)"
                  onFileSelect={handleVideoSelect}
                  selectedFile={videoFile}
                  previewUrl={videoPreview}
                  onClear={clearVideo}
                  isUploading={isUploadingVideo}
                  progress={videoProgress}
                  disabled={isUploadingImage} // Prevent simultaneous interactions for simplicity
                />
              </div>

              {/* Step 2: Image Asset */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2 px-1">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold border border-slate-700">2</div>
                  <span className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Object to Insert</span>
                </div>
                <Dropzone 
                  type={MediaType.IMAGE}
                  label="Upload Asset"
                  subLabel="PNG, JPG (Transparent BG recommended)"
                  onFileSelect={handleImageSelect}
                  selectedFile={imageFile}
                  previewUrl={imagePreview}
                  onClear={clearImage}
                  isUploading={isUploadingImage}
                  progress={imageProgress}
                  disabled={isUploadingVideo}
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-center pt-8">
              <button
                onClick={startProcessing}
                disabled={!isReadyToProcess}
                className={`
                  group relative px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 shadow-2xl transition-all duration-300
                  ${!isReadyToProcess 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-105 hover:shadow-indigo-500/25 ring-4 ring-indigo-900/20'
                  }
                `}
              >
                {!isReadyToProcess ? (
                   <span className="flex items-center gap-2">
                     <LayoutTemplate size={20} /> Select Files to Continue
                   </span>
                ) : (
                  <>
                    <Wand2 className="group-hover:rotate-12 transition-transform" />
                    <span>Generate Placement</span>
                    <ChevronRight className="opacity-60 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* RESULTS STAGE */}
        {status === AppStatus.COMPLETED && (
          <div className="space-y-12 animate-fade-in">
             <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Placement Complete</h2>
              <p className="text-slate-400">Use the slider below to verify spatial consistency and occlusion accuracy.</p>
            </div>
            
            {/* The Comparison Component */}
            {videoPreview && (
              <VideoComparison 
                beforeSrc={videoPreview}
                afterSrc={resultVideoSrc} 
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-12 border-t border-slate-800">
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                <h4 className="font-semibold text-white mb-2">Spatial Mapping</h4>
                <p className="text-sm text-slate-400">3D scene coordinates extracted to align the asset with the ground plane.</p>
              </div>
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                <h4 className="font-semibold text-white mb-2">Illumination Harmonization</h4>
                <p className="text-sm text-slate-400">Light direction and temperature adjusted to match source footage.</p>
              </div>
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                <h4 className="font-semibold text-white mb-2">Occlusion Awareness</h4>
                <p className="text-sm text-slate-400">Foreground objects mask the inserted asset dynamically.</p>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY SECTION */}
        {history.length > 0 && (
          <div className="mt-24 pt-12 border-t border-slate-800 animate-fade-in">
            <div className="flex items-center gap-3 mb-8">
              <HistoryIcon className="text-indigo-400" />
              <h3 className="text-xl font-bold text-white">Recent Projects</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => restoreHistoryItem(item)}
                  className="group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden cursor-pointer hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300"
                >
                  <div className="relative h-40 bg-black overflow-hidden">
                    {/* Background Video Thumbnail */}
                    <video 
                      src={item.sourceVideoUrl} 
                      className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
                      muted 
                    />
                    
                    {/* Inserted Image Overlay */}
                    <div className="absolute bottom-2 right-2 w-16 h-16 bg-slate-950/80 rounded-lg border border-slate-700 p-1 backdrop-blur-sm shadow-lg">
                      <img src={item.insertedImageUrl} className="w-full h-full object-contain" alt="Asset" />
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
                       <PlayCircle size={48} className="text-white drop-shadow-lg" />
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-medium text-slate-200 truncate pr-2">{item.sourceFileName}</h4>
                      <span className="text-[10px] text-slate-500 font-mono pt-1">
                        {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      w/ {item.imageFileName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
