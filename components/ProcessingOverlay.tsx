
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Loader2, CheckCircle2, Clock } from 'lucide-react';
import { PROCESSING_PHASES } from '../constants';

interface ProcessingOverlayProps {
  onComplete: () => void;
  totalDurationOverride?: number | null;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ onComplete, totalDurationOverride }) => {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const startTimeRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number>(0);

  // Calculate phases based on override or default
  const activePhases = useMemo(() => {
    if (!totalDurationOverride) return PROCESSING_PHASES;

    const defaultTotal = PROCESSING_PHASES.reduce((acc, p) => acc + p.duration, 0);
    const scale = totalDurationOverride / defaultTotal;

    return PROCESSING_PHASES.map(phase => ({
      ...phase,
      duration: phase.duration * scale
    }));
  }, [totalDurationOverride]);

  // Calculate total duration
  const totalDuration = useMemo(() => 
    activePhases.reduce((acc, phase) => acc + phase.duration, 0), 
  [activePhases]);

  useEffect(() => {
    startTimeRef.current = Date.now();

    const updateProgress = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      setElapsedTime(elapsed);

      // Calculate progress percentage (0-100)
      const newProgress = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(newProgress);

      // Determine current phase based on elapsed time
      let accumulatedTime = 0;
      
      for (let i = 0; i < activePhases.length; i++) {
        accumulatedTime += activePhases[i].duration;
        if (elapsed < accumulatedTime) {
          setCurrentPhaseIndex(i);
          break;
        }
      }

      // If we exceeded total time (or are in the last bit), we are done
      if (elapsed >= totalDuration) {
        setCurrentPhaseIndex(activePhases.length - 1); // Stay on last step
        if (elapsed >= totalDuration + 500) { // Add a small buffer before closing
            onComplete();
            return; 
        }
      }

      animationFrameRef.current = requestAnimationFrame(updateProgress);
    };

    animationFrameRef.current = requestAnimationFrame(updateProgress);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [totalDuration, onComplete, activePhases]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden">
        
        {/* Background glow */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-indigo-500/30 blur-xl rounded-full"></div>
            <Loader2 className="relative w-12 h-12 text-indigo-400 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Generating Composite</h2>
          
          <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-slate-800/50 rounded-full border border-slate-700/50">
            <Clock size={14} className="text-indigo-400" />
            <span className="text-indigo-200 font-mono text-sm">
              {(elapsedTime / 1000).toFixed(1)}s
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Phases List */}
          <div className="space-y-3">
            {activePhases.map((phase, index) => {
              const isActive = index === currentPhaseIndex;
              const isCompleted = index < currentPhaseIndex;
              const isPending = index > currentPhaseIndex;
              
              return (
                <div 
                  key={index} 
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 border ${
                    isActive 
                      ? 'bg-slate-800 border-indigo-500/30 translate-x-2' 
                      : 'border-transparent'
                  } ${isPending ? 'opacity-30' : 'opacity-100'}`}
                >
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 shrink-0">
                        <CheckCircle2 size={14} />
                    </div>
                  ) : isActive ? (
                    <div className="w-5 h-5 shrink-0 relative">
                        <div className="absolute inset-0 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-700 shrink-0" />
                  )}
                  
                  <span className={`text-sm transition-colors ${
                    isActive ? 'text-indigo-200 font-medium' : 
                    isCompleted ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {phase.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
