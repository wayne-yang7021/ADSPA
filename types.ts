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