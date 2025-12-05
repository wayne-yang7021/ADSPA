
import React, { useState, useEffect } from 'react';
import { Layers, Wand2, ChevronRight, LayoutTemplate, History as HistoryIcon, PlayCircle, Settings2, X, UploadCloud, Image as ImageIcon, Video as VideoIcon, Clock } from 'lucide-react';
import { Dropzone } from './components/Dropzone';
import { VideoComparison } from './components/VideoComparison';
import { ProcessingOverlay } from './components/ProcessingOverlay';
import { AppStatus, MediaType, HistoryItem, SimulationConfig } from './types';
import { MOCK_RESULT_VIDEO, DEFAULT_ASSETS, DEFAULT_PHASE_DURATIONS, PHASE_LABELS } from './constants';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  
  // File State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [extractedFrame, setExtractedFrame] = useState<string | null>(null); // New state for first frame
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // --- CONFIGURATION STATE (God Mode) ---
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [activeConfigTab, setActiveConfigTab] = useState<1 | 2 | 3>(1);

  // Config Data
  const [config, setConfig] = useState<SimulationConfig>({
    phase1: { duration: DEFAULT_PHASE_DURATIONS.phase1, label: PHASE_LABELS.phase1 },
    phase2: { duration: DEFAULT_PHASE_DURATIONS.phase2, label: PHASE_LABELS.phase2 },
    phase3: { duration: DEFAULT_PHASE_DURATIONS.phase3, label: PHASE_LABELS.phase3 },
    assets: { ...DEFAULT_ASSETS },
    resultVideoUrl: MOCK_RESULT_VIDEO
  });

  // Temporary state for the modal (so we can cancel)
  const [tempConfig, setTempConfig] = useState<SimulationConfig>(config);

  // Helper to handle file input in settings
  const handleConfigUpload = (
    field: keyof typeof DEFAULT_ASSETS | 'resultVideoUrl', 
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      if (field === 'resultVideoUrl') {
        setTempConfig(prev => ({ ...prev, resultVideoUrl: url }));
      } else {
        setTempConfig(prev => ({
          ...prev,
          assets: { ...prev.assets, [field]: url }
        }));
      }
    }
  };

  const handleDurationChange = (phase: 'phase1' | 'phase2' | 'phase3', val: string) => {
    const num = parseInt(val);
    if (!isNaN(num) && num > 0) {
      setTempConfig(prev => ({
        ...prev,
        [phase]: { ...prev[phase], duration: num * 1000 } // convert to ms
      }));
    }
  };

  const openSettings = () => {
    setTempConfig(config); // Load current config into temp
    setShowConfigModal(true);
  };

  const saveSettings = () => {
    setConfig(tempConfig);
    setShowConfigModal(false);
  };

  // --- HELPER: Generate Thumbnail from Video ---
  const generateVideoThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.playsInline = true;
      video.currentTime = 0.5; // Capture at 0.5s to avoid black frames

      video.onloadeddata = () => {
        // Wait a tick for seek
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        resolve(dataUrl);
      };
      
      // Fallback if seek event doesn't fire immediately
      setTimeout(() => {
          if (video.readyState >= 2) {
             video.dispatchEvent(new Event('seeked'));
          }
      }, 500);
    });
  };

  // Helper to simulate upload (Main App)
  const simulateUpload = (
    file: File, 
    setFile: (f: File) => void, 
    setPreview: (url: string) => void,
    setUploading: (b: boolean) => void,
    setProgress: (n: number) => void,
    onComplete?: (file: File) => void
  ) => {
    setUploading(true);
    setProgress(0);
    setFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);

    let currentProgress = 0;
    const increment = file.type.startsWith('video') ? 2 : 5; 
    const intervalTime = 50;

    const interval = setInterval(() => {
      currentProgress += Math.random() * increment;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setTimeout(() => {
            setUploading(false);
            if (onComplete) onComplete(file);
        }, 400);
      }
      setProgress(currentProgress);
    }, intervalTime);
  };

  const handleVideoSelect = (file: File) => {
    simulateUpload(file, setVideoFile, setVideoPreview, setIsUploadingVideo, setVideoProgress, async (f) => {
      const thumb = await generateVideoThumbnail(f);
      setExtractedFrame(thumb);
    });
  };
  
  const handleImageSelect = (file: File) => simulateUpload(file, setImageFile, setImagePreview, setIsUploadingImage, setImageProgress);

  const clearVideo = () => { 
    if (!isUploadingVideo) { 
        setVideoFile(null); 
        setVideoPreview(null); 
        setExtractedFrame(null);
        setVideoProgress(0); 
    } 
  };
  const clearImage = () => { if (!isUploadingImage) { setImageFile(null); setImagePreview(null); setImageProgress(0); } };

  const startProcessing = () => {
    if (!videoFile || !imageFile) return;
    setStatus(AppStatus.PROCESSING);
  };

  const handleProcessingComplete = () => {
    if (videoPreview && imagePreview) {
      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        sourceVideoUrl: videoPreview,
        insertedImageUrl: imagePreview,
        resultVideoUrl: config.resultVideoUrl,
        sourceFileName: videoFile?.name || 'Unknown Video',
        imageFileName: imageFile?.name || 'Unknown Image'
      };
      setHistory(prev => [newItem, ...prev]);
    }
    setStatus(AppStatus.COMPLETED);
  };

  const restoreHistoryItem = (item: HistoryItem) => {
    setVideoPreview(item.sourceVideoUrl);
    // For history restore, we assume the extracted frame might be lost or we just use video preview
    // In a real app we'd save the thumb to history too.
    setStatus(AppStatus.COMPLETED);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetAll = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setExtractedFrame(null);
    setImageFile(null);
    setImagePreview(null);
    setVideoProgress(0);
    setImageProgress(0);
    setStatus(AppStatus.IDLE);
  };

  const isReadyToProcess = videoFile && !isUploadingVideo && imageFile && !isUploadingImage;

  // Mini File Input Component for Settings
  const SettingsFileInput = ({ 
    label, 
    currentUrl, 
    onChange, 
    accept = "image/*" 
  }: { 
    label: string, 
    currentUrl: string, 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    accept?: string
  }) => (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</label>
      <div className="flex gap-4 items-start">
        <div className="w-24 h-16 bg-black rounded-lg border border-slate-700 overflow-hidden flex-shrink-0">
          {accept.includes('video') ? (
             <video src={currentUrl} className="w-full h-full object-cover opacity-70" />
          ) : (
             <img src={currentUrl} className="w-full h-full object-cover opacity-70" alt="Preview" />
          )}
        </div>
        <div className="flex-1">
          <label className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors w-fit border border-slate-700 text-sm text-slate-300">
            <UploadCloud size={16} />
            <span>Change File</span>
            <input type="file" className="hidden" accept={accept} onChange={onChange} />
          </label>
        </div>
      </div>
    </div>
  );

  // Dynamic config for processing overlay (Merging User Data with Settings)
  const runtimeConfig: SimulationConfig = {
    ...config,
    assets: {
      ...config.assets,
      // Overwrite Phase 1 assets with real user data if available
      spatialFrame: extractedFrame || config.assets.spatialFrame,
      spatialAsset: imagePreview || config.assets.spatialAsset,
      // Phase 1 BBox and all Phase 2 assets come from Config (God Mode)
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 pb-20">
      
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[100px]"></div>
      </div>

      {/* --- SETTINGS MODAL --- */}
      {showConfigModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Settings2 size={20} className="text-indigo-400" />
                  Simulation Configuration
                </h3>
                <p className="text-sm text-slate-400 mt-1">Customize the assets shown during each generation phase.</p>
              </div>
              <button onClick={() => setShowConfigModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800">
              <button 
                onClick={() => setActiveConfigTab(1)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${activeConfigTab === 1 ? 'border-indigo-500 text-white bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              >
                Phase 1: Spatial
              </button>
              <button 
                onClick={() => setActiveConfigTab(2)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${activeConfigTab === 2 ? 'border-indigo-500 text-white bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              >
                Phase 2: Occlusion
              </button>
              <button 
                onClick={() => setActiveConfigTab(3)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${activeConfigTab === 3 ? 'border-indigo-500 text-white bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              >
                Phase 3: Diffusion
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              
              {/* TAB 1: SPATIAL */}
              {activeConfigTab === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                     <label className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                       <Clock size={16} className="text-indigo-400"/> Phase Duration (seconds)
                     </label>
                     <input 
                       type="number" 
                       min="1"
                       value={tempConfig.phase1.duration / 1000}
                       onChange={(e) => handleDurationChange('phase1', e.target.value)}
                       className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 transition-colors"
                     />
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white border-b border-slate-800 pb-2">Window Assets</h4>
                    
                    <div className="p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg text-sm text-indigo-300 mb-4">
                       <span className="font-bold">Note:</span> The <strong>Background Frame</strong> and <strong>Asset Image</strong> for Phase 1 are automatically extracted from the user's uploaded files.
                    </div>

                    <SettingsFileInput 
                      label="3. Bounding Box (Highlighted)" 
                      currentUrl={tempConfig.assets.spatialBox}
                      onChange={(e) => handleConfigUpload('spatialBox', e)}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: OCCLUSION */}
              {activeConfigTab === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                     <label className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                       <Clock size={16} className="text-purple-400"/> Phase Duration (seconds)
                     </label>
                     <input 
                       type="number" 
                       min="1"
                       value={tempConfig.phase2.duration / 1000}
                       onChange={(e) => handleDurationChange('phase2', e.target.value)}
                       className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500 transition-colors"
                     />
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white border-b border-slate-800 pb-2">Window Assets</h4>
                    <SettingsFileInput 
                      label="1. Segmentation Mask" 
                      currentUrl={tempConfig.assets.occlusionMask}
                      onChange={(e) => handleConfigUpload('occlusionMask', e)}
                    />
                    <SettingsFileInput 
                      label="2. Occlusion Result (Composite)" 
                      currentUrl={tempConfig.assets.occlusionResult}
                      onChange={(e) => handleConfigUpload('occlusionResult', e)}
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: RESULT */}
              {activeConfigTab === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                     <label className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                       <Clock size={16} className="text-pink-400"/> Phase Duration (seconds)
                     </label>
                     <input 
                       type="number" 
                       min="1"
                       value={tempConfig.phase3.duration / 1000}
                       onChange={(e) => handleDurationChange('phase3', e.target.value)}
                       className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-pink-500 transition-colors"
                     />
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white border-b border-slate-800 pb-2">Final Output</h4>
                    <SettingsFileInput 
                      label="Final Result Video" 
                      currentUrl={tempConfig.resultVideoUrl}
                      onChange={(e) => handleConfigUpload('resultVideoUrl', e)}
                      accept="video/*"
                    />
                    <p className="text-xs text-slate-500">This video will play automatically after the simulation phases complete.</p>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900/50">
              <button 
                onClick={() => setShowConfigModal(false)}
                className="px-5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={saveSettings}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-95 font-medium"
              >
                Save Configuration
              </button>
            </div>

          </div>
        </div>
      )}


      {/* --- HEADER --- */}
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
                  onClick={openSettings}
                  className="p-1.5 rounded-lg bg-slate-800/50 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-all"
                  title="Configure Simulation"
                >
                  <Settings2 size={16} />
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

      {/* --- MAIN CONTENT --- */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        
        {/* Processing State */}
        {status === AppStatus.PROCESSING && (
          <ProcessingOverlay 
            config={runtimeConfig}
            onComplete={handleProcessingComplete} 
          />
        )}

        {/* Idle (Upload) State */}
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
                  disabled={isUploadingImage}
                />
              </div>

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

        {/* Completed State */}
        {status === AppStatus.COMPLETED && (
          <div className="space-y-12 animate-fade-in">
             <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Placement Complete</h2>
              <p className="text-slate-400">Use the slider below to verify spatial consistency and occlusion accuracy.</p>
            </div>
            
            {videoPreview && (
              <VideoComparison 
                beforeSrc={videoPreview}
                afterSrc={config.resultVideoUrl} 
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

        {/* History Section */}
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
                    <video 
                      src={item.sourceVideoUrl} 
                      className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
                      muted 
                    />
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
