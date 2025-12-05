export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
}

export interface FileData {
  file: File;
  previewUrl: string;
}

export enum MediaType {
  VIDEO = 'VIDEO',
  IMAGE = 'IMAGE',
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  sourceVideoUrl: string;
  insertedImageUrl: string;
  resultVideoUrl: string;
  sourceFileName: string;
  imageFileName: string;
}

export interface SimulationAssets {
  // Phase 1: Spatial
  spatialFrame: string;    // The background frame
  spatialAsset: string;    // The item being inserted
  spatialBox: string;      // The bounding box overlay
  
  // Phase 2: Occlusion
  occlusionMask: string;   // The segmentation mask
  occlusionResult: string; // The object with occlusion applied
}

export interface PhaseConfig {
  duration: number; // in milliseconds
  label: string;
}

export interface SimulationConfig {
  phase1: PhaseConfig;
  phase2: PhaseConfig;
  phase3: PhaseConfig;
  assets: SimulationAssets;
  resultVideoUrl: string;
}