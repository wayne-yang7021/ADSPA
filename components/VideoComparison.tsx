import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RefreshCcw, Download } from 'lucide-react';

interface VideoComparisonProps {
  beforeSrc: string;
  afterSrc: string;
}

export const VideoComparison: React.FC<VideoComparisonProps> = ({ beforeSrc, afterSrc }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isReady, setIsReady] = useState(false);

  const beforeVideoRef = useRef<HTMLVideoElement>(null);
  const afterVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync videos
  const togglePlay = () => {
    if (beforeVideoRef.current && afterVideoRef.current) {
      if (isPlaying) {
        beforeVideoRef.current.pause();
        afterVideoRef.current.pause();
      } else {
        beforeVideoRef.current.play();
        afterVideoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    // Ensure sync if one drifts
    if (beforeVideoRef.current && afterVideoRef.current) {
        // Simple sync: if difference > 0.1s, snap after to before
        if (Math.abs(beforeVideoRef.current.currentTime - afterVideoRef.current.currentTime) > 0.1) {
            afterVideoRef.current.currentTime = beforeVideoRef.current.currentTime;
        }
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(Number(e.target.value));
  };

  // Wait for both to load metadata
  useEffect(() => {
    let loadedCount = 0;
    const handleLoad = () => {
      loadedCount++;
      if (loadedCount === 2) setIsReady(true);
    };

    const v1 = beforeVideoRef.current;
    const v2 = afterVideoRef.current;

    if (v1) v1.addEventListener('loadedmetadata', handleLoad);
    if (v2) v2.addEventListener('loadedmetadata', handleLoad);

    return () => {
      if (v1) v1.removeEventListener('loadedmetadata', handleLoad);
      if (v2) v2.removeEventListener('loadedmetadata', handleLoad);
    };
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-up">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-1 shadow-2xl overflow-hidden">
        
        {/* Comparison Viewer */}
        <div ref={containerRef} className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black group select-none">
          
          {/* Before Video (Bottom Layer) */}
          <video
            ref={beforeVideoRef}
            src={beforeSrc}
            className="absolute inset-0 w-full h-full object-cover"
            onTimeUpdate={handleTimeUpdate}
            loop
            muted
            playsInline
          />

          {/* Label: Before */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider z-20 pointer-events-none border border-white/10">
            Original
          </div>

          {/* After Video (Top Layer - Clipped) */}
          <div 
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <video
              ref={afterVideoRef}
              src={afterSrc}
              className="absolute top-0 left-0 w-full h-full object-cover max-w-none"
              style={{ width: containerRef.current ? containerRef.current.clientWidth : '100%' }}
              loop
              muted
              playsInline
            />
          </div>

          {/* Label: After */}
          <div className="absolute top-4 right-4 bg-indigo-600/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider z-20 pointer-events-none border border-white/10 shadow-lg shadow-indigo-500/20">
            Processed
          </div>

          {/* Slider Control */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPosition}
            onChange={handleSliderChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
          />

          {/* Visual Slider Line */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 pointer-events-none shadow-[0_0_20px_rgba(255,255,255,0.5)]"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg transform active:scale-95 transition-transform">
                <RefreshCcw size={14} className="text-indigo-600 rotate-90" />
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="p-4 flex items-center justify-between bg-slate-900">
          <button 
            onClick={togglePlay}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
          >
            {isPlaying ? (
              <>
                <Pause size={18} fill="currentColor" /> Pause Comparison
              </>
            ) : (
              <>
                <Play size={18} fill="currentColor" /> Play Comparison
              </>
            )}
          </button>

          <div className="text-slate-400 text-sm font-medium">
            Drag slider to compare
          </div>

          <a 
            href={afterSrc} 
            download="processed_video.mp4"
            className="flex items-center gap-2 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <Download size={18} /> Download
          </a>
        </div>
      </div>
    </div>
  );
};
