
import React, { useEffect, useState, useRef } from 'react';
import { Loader2, Scan, Layers, Wand2, CheckCircle2, Terminal, Target, FileImage, Cpu, Activity } from 'lucide-react';
import { SimulationConfig } from '../types';

interface ProcessingOverlayProps {
  config: SimulationConfig;
  onComplete: () => void;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ config, onComplete }) => {
  const [currentPhase, setCurrentPhase] = useState<1 | 2 | 3>(1);
  const [elapsedInPhase, setElapsedInPhase] = useState(0);
  
  // Store config durations in refs so we can access them in the loop 
  // without adding them to useEffect dependencies
  const durationsRef = useRef({
    t1: config.phase1.duration,
    t2: config.phase2.duration,
    t3: config.phase3.duration,
    total: config.phase1.duration + config.phase2.duration + config.phase3.duration
  });

  useEffect(() => {
    const startTime = Date.now();
    let animationFrameId: number;

    const loop = () => {
      const now = Date.now();
      const totalElapsed = now - startTime;
      const { t1, t2, total } = durationsRef.current;

      if (totalElapsed < t1) {
        setCurrentPhase(1);
        setElapsedInPhase(totalElapsed);
      } else if (totalElapsed < t1 + t2) {
        setCurrentPhase(2);
        setElapsedInPhase(totalElapsed - t1);
      } else if (totalElapsed < total) {
        setCurrentPhase(3);
        setElapsedInPhase(totalElapsed - (t1 + t2));
      } else {
        // Ensure we show 100% at the very end before completing
        setElapsedInPhase(durationsRef.current.t3); 
        onComplete();
        return; 
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [onComplete]); 

  // Helper to calculate progress percentage (0-100) for current phase
  const getPhaseProgress = () => {
    const { t1, t2, t3 } = durationsRef.current;
    const duration = currentPhase === 1 ? t1 : currentPhase === 2 ? t2 : t3;
    return Math.min((elapsedInPhase / duration) * 100, 100);
  };

  const currentProgress = getPhaseProgress();

  // Status Log Messages based on phase and progress
  const getStatusMessage = () => {
    if (currentPhase === 1) {
      if (currentProgress < 30) return "Scanning geometry...";
      if (currentProgress < 60) return "Detecting planar surfaces...";
      return "Calculating optimal insertion coordinates...";
    }
    if (currentPhase === 2) {
      if (currentProgress < 33) return "Analyzing scene composition...";
      if (currentProgress < 66) return "Generating SAM depth segmentation...";
      return "Compositing occlusion layers...";
    }
    return "Running stable diffusion synthesis...";
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-xl animate-fade-in font-sans">
      
      {/* Main Display Container */}
      <div className="w-full max-w-5xl px-6">
        
        {/* Header Status */}
        <div className="flex justify-between items-end mb-6 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs mb-1 uppercase tracking-widest">
              <Cpu size={14} className="animate-pulse" />
              ADSPA ENGINE V2.1
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
               {currentPhase === 1 && <><Scan className="text-indigo-500" /> SPATIAL ANALYSIS</>}
               {currentPhase === 2 && <><Layers className="text-purple-500" /> OCCLUSION LOGIC</>}
               {currentPhase === 3 && <><Wand2 className="text-pink-500" /> DIFFUSION SYNTHESIS</>}
            </h2>
          </div>
          <div className="text-right">
            <div className="text-3xl font-mono font-bold text-slate-200">
              {Math.floor(currentProgress)}<span className="text-sm text-slate-500 ml-1">%</span>
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Phase Progress</div>
          </div>
        </div>

        {/* Dynamic Visualization Window */}
        <div className="relative h-[500px] w-full bg-black rounded-3xl border border-slate-800 overflow-hidden shadow-2xl group">
          
          {/* Grid Overlay Background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

          {/* PHASE 1: SPATIAL (Sequential Reveal) */}
          {currentPhase === 1 && (
            <div className="absolute inset-0 flex items-center justify-center p-8">
               
               {/* Layer 1: Base Frame */}
               <div className="relative w-full h-full max-w-3xl aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-700 shadow-2xl">
                  <img src={config.assets.spatialFrame} className="w-full h-full object-cover opacity-60" alt="Analysis Frame" />
                  
                  {/* Scanner Animation */}
                  <div className="absolute inset-0 bg-indigo-500/10 z-10" style={{ opacity: currentProgress < 100 ? 0.5 : 0 }}></div>
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-indigo-400 shadow-[0_0_20px_rgba(99,102,241,1)] z-20 transition-none ease-linear"
                    style={{ left: `${currentProgress}%` }} 
                  ></div>

                  {/* Layer 2: Asset (Appears at 30%) */}
                  <div 
                    className={`absolute bottom-4 left-4 w-32 h-32 bg-slate-900/90 border border-white/20 rounded-lg p-2 backdrop-blur-md transition-all duration-500 transform ${currentProgress > 30 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                  >
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1 border-b border-white/10 pb-1">
                      <FileImage size={10} /> ASSET LOADED
                    </div>
                    <img src={config.assets.spatialAsset} className="w-full h-full object-contain" alt="Asset" />
                  </div>

                  {/* Layer 3: BBox (Appears at 60%) */}
                  <div 
                    className={`absolute inset-0 transition-opacity duration-300 ${currentProgress > 60 ? 'opacity-100' : 'opacity-0'}`}
                  >
                     <img src={config.assets.spatialBox} className="absolute inset-0 w-full h-full object-cover mix-blend-screen" alt="BBox" />
                     {/* Bounding Box Decoration */}
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] border-2 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                        <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-green-500"></div>
                        <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-green-500"></div>
                        <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-green-500"></div>
                        <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-green-500"></div>
                        <div className="absolute top-2 right-2 bg-green-500 text-black text-[10px] font-bold px-1">CONF: 98%</div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* PHASE 2: OCCLUSION (3-Stage Sequence: Original -> Depth -> Result) */}
          {currentPhase === 2 && (
             <div className="absolute inset-0 flex items-center justify-center p-8">
               <div className="relative w-full h-full max-w-3xl aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-700 shadow-2xl">
                 
                 {/* 1. Base: Original Frame (Always there, covered by others later) */}
                 <img src={config.assets.spatialFrame} className="absolute inset-0 w-full h-full object-cover" alt="Original" />
                 
                 {/* 2. Layer: Depth Map (Fades in at 33%) */}
                 <div 
                   className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                   style={{ opacity: currentProgress > 33 ? 1 : 0 }}
                 >
                    <img src={config.assets.occlusionMask} className="w-full h-full object-cover" alt="Depth Map" />
                    <div className="absolute top-4 left-4 bg-purple-600/90 text-white px-2 py-1 rounded text-xs font-bold uppercase tracking-wider shadow-lg">
                      SAM Segmentation
                    </div>
                 </div>

                 {/* 3. Layer: Occlusion Result (Fades in at 66%) */}
                 <div 
                   className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                   style={{ opacity: currentProgress > 66 ? 1 : 0 }}
                 >
                    <img src={config.assets.occlusionResult} className="w-full h-full object-cover" alt="Result" />
                    <div className="absolute top-4 left-4 bg-indigo-600/90 text-white px-2 py-1 rounded text-xs font-bold uppercase tracking-wider shadow-lg">
                      Occlusion Resolved
                    </div>
                 </div>

                 {/* Scan Line Overlay during transitions */}
                 <div 
                    className="absolute inset-x-0 h-1 bg-white/50 shadow-[0_0_15px_rgba(255,255,255,0.8)] z-20 transition-all duration-300"
                    style={{ 
                      top: `${(currentProgress % 33) * 3}%`,
                      opacity: (currentProgress > 30 && currentProgress < 36) || (currentProgress > 63 && currentProgress < 69) ? 1 : 0
                    }} 
                 ></div>

               </div>
             </div>
          )}

          {/* PHASE 3: DIFFUSION (Large Loading Bar) */}
          {currentPhase === 3 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 p-12">
                <div className="relative w-full max-w-2xl text-center">
                   
                   {/* Centerpiece Animation */}
                   <div className="relative mx-auto w-40 h-40 mb-10 flex items-center justify-center">
                      <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                      <div 
                        className="absolute inset-0 border-4 border-transparent border-t-pink-500 border-r-pink-500 rounded-full animate-spin"
                        style={{ animationDuration: '1.5s' }}
                      ></div>
                      <div className="absolute inset-4 bg-pink-500/10 rounded-full blur-xl animate-pulse"></div>
                      <Wand2 size={56} className="text-pink-100 relative z-10" />
                   </div>

                   {/* Main Progress Bar Title */}
                   <h3 className="text-xl font-bold text-white mb-2">Generating Final Video</h3>
                   <p className="text-slate-400 text-sm mb-6">Running latent diffusion steps and frame interpolation...</p>

                   {/* LARGE PROGRESS BAR */}
                   <div className="w-full h-6 bg-slate-800 rounded-full overflow-hidden border border-slate-700 shadow-inner relative">
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.05)_75%,transparent_75%,transparent)] bg-[size:20px_20px] animate-[slide_1s_linear_infinite] opacity-30 z-10"></div>
                      
                      <div 
                        className="h-full bg-gradient-to-r from-pink-600 to-indigo-600 transition-all duration-100 ease-linear shadow-[0_0_20px_rgba(236,72,153,0.5)]"
                        style={{ width: `${currentProgress}%` }}
                      ></div>
                   </div>

                   {/* Stats Row */}
                   <div className="flex justify-between mt-4 text-xs font-mono text-slate-500">
                      <span className="flex items-center gap-1"><Activity size={12}/> VRAM: 12.4GB</span>
                      <span>STEPS: {Math.floor(currentProgress / 2)} / 50</span>
                   </div>

                </div>
            </div>
          )}

          {/* Terminal Log Footer (Always Visible inside Window) */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-black/80 backdrop-blur border-t border-slate-800 flex items-center px-6 font-mono text-xs text-green-400 z-30">
             <Terminal size={12} className="mr-2 opacity-50" />
             <span className="animate-pulse mr-2">_</span>
             <span>{getStatusMessage()}</span>
          </div>

        </div>

        {/* Global Process Timeline */}
        <div className="mt-8 relative">
           <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -z-10"></div>
           <div className="flex justify-between">
              {[1, 2, 3].map(step => (
                <div key={step} className="flex flex-col items-center gap-3">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
                     step < currentPhase ? 'bg-indigo-500 border-indigo-500 text-white scale-100' :
                     step === currentPhase ? 'bg-slate-900 border-indigo-500 text-indigo-400 scale-110 shadow-[0_0_15px_rgba(99,102,241,0.5)]' :
                     'bg-slate-900 border-slate-700 text-slate-600 scale-100'
                   }`}>
                      {step < currentPhase ? <CheckCircle2 size={18} /> : 
                       step === 1 ? <Target size={18} /> : 
                       step === 2 ? <Layers size={18} /> : <Wand2 size={18} />
                      }
                   </div>
                   <div className={`text-xs font-bold uppercase tracking-wider transition-colors ${step === currentPhase ? 'text-white' : 'text-slate-500'}`}>
                      {step === 1 ? 'Spatial' : step === 2 ? 'Occlusion' : 'Diffusion'}
                   </div>
                </div>
              ))}
           </div>
           
           {/* Connecting Line Progress */}
           <div className="absolute top-1/2 left-0 h-0.5 bg-indigo-500 transition-all duration-300 -z-10" 
             style={{ width: `${((currentPhase - 1) / 2) * 100}%` }}
           ></div>
        </div>

      </div>
    </div>
  );
};

// Simple Icon Component for the arrow
const ChevronRightDouble = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m13 17 5-5-5-5"/>
    <path d="m6 17 5-5-5-5"/>
  </svg>
);
