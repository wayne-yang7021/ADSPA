import React, { useRef, useState } from 'react';
import { UploadCloud, FileVideo, Image as ImageIcon, X, FileUp, CheckCircle2 } from 'lucide-react';
import { MediaType } from '../types';

interface DropzoneProps {
  type: MediaType;
  label: string;
  subLabel: string;
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  previewUrl: string | null;
  onClear: () => void;
  disabled?: boolean;
  isUploading?: boolean;
  progress?: number;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  type,
  label,
  subLabel,
  onFileSelect,
  selectedFile,
  previewUrl,
  onClear,
  disabled = false,
  isUploading = false,
  progress = 0,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndPass(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndPass(e.target.files[0]);
    }
    // Reset value so the same file can be selected again if needed
    e.target.value = '';
  };

  const validateAndPass = (file: File) => {
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (type === MediaType.VIDEO && !validVideoTypes.includes(file.type)) {
      alert('Please select a valid video file (MP4, WebM, MOV)');
      return;
    }
    if (type === MediaType.IMAGE && !validImageTypes.includes(file.type)) {
      alert('Please select a valid image file (JPG, PNG, WEBP)');
      return;
    }
    onFileSelect(file);
  };

  // State: Uploading
  if (selectedFile && isUploading) {
    return (
      <div className="relative w-full h-64 rounded-2xl border border-slate-700 bg-slate-900/50 flex flex-col items-center justify-center p-8 overflow-hidden">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 animate-pulse"></div>
        
        <div className="z-10 w-full max-w-xs flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center shadow-inner relative">
            <FileUp className="text-indigo-400 animate-bounce" size={28} />
            <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full border-t-indigo-500 animate-spin"></div>
          </div>
          
          <div className="text-center w-full">
            <p className="text-white font-medium truncate mb-1">{selectedFile.name}</p>
            <p className="text-xs text-slate-400 font-mono">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>

          <div className="w-full space-y-2">
            <div className="flex justify-between text-xs font-semibold text-indigo-300 uppercase">
              <span>Uploading</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State: Preview (Upload Complete)
  if (selectedFile && previewUrl) {
    return (
      <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 group shadow-lg transition-all hover:border-slate-500 animate-fade-in">
        <button
          onClick={onClear}
          className="absolute top-3 right-3 z-20 p-2 bg-black/60 hover:bg-red-500/80 text-white rounded-full backdrop-blur-md transition-colors shadow-lg"
          disabled={disabled}
        >
          <X size={16} />
        </button>
        
        {type === MediaType.VIDEO ? (
          <video
            src={previewUrl}
            className="w-full h-full object-cover opacity-90"
            controls={false}
            muted
            loop
            autoPlay
            playsInline
          />
        ) : (
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover opacity-90" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity pointer-events-none" />

        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg backdrop-blur-md ${type === MediaType.VIDEO ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-pink-500/20 text-pink-300 border border-pink-500/30'}`}>
              <CheckCircle2 size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{selectedFile.name}</p>
              <div className="flex items-center gap-2">
                 <p className="text-[10px] text-green-400 font-bold uppercase tracking-wider bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">Uploaded</p>
                 <p className="text-xs text-slate-400">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State: Empty (Default)
  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative w-full h-64 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group overflow-hidden
        ${isDragOver 
          ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]' 
          : 'border-slate-700 bg-slate-800/30 hover:bg-slate-800/60 hover:border-slate-500'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={type === MediaType.VIDEO ? "video/*" : "image/*"}
        disabled={disabled}
        onChange={handleChange}
      />
      
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <div className={`
        relative p-4 rounded-full mb-4 transition-transform duration-300 group-hover:scale-110 shadow-xl
        ${isDragOver ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}
      `}>
        {type === MediaType.VIDEO ? <FileVideo size={32} /> : <ImageIcon size={32} />}
      </div>
      
      <h3 className="relative text-lg font-semibold text-slate-200 mb-1">{label}</h3>
      <p className="relative text-sm text-slate-500 text-center max-w-[80%]">{subLabel}</p>
      
      {isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-indigo-500/10 backdrop-blur-[2px] z-10">
          <div className="bg-slate-900/90 text-indigo-400 px-6 py-3 rounded-xl border border-indigo-500/50 shadow-2xl font-bold tracking-wide flex items-center gap-2 animate-bounce">
            <UploadCloud size={20} />
            RELEASE TO UPLOAD
          </div>
        </div>
      )}
    </div>
  );
};