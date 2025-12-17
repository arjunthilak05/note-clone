export type DocumentStatus =
  | 'UPLOADED'
  | 'EXTRACTING_TEXT'
  | 'GENERATING_SCRIPT'
  | 'GENERATING_AUDIO'
  | 'COMPLETED'
  | 'FAILED';

export type AudioStatus = 'GENERATING' | 'COMPLETED' | 'FAILED';

export interface Document {
  id: string;
  userId?: string;
  originalFilename: string;
  filePath: string;
  fileSize: number;
  pageCount?: number;
  extractedText?: string;
  status: DocumentStatus;
  errorMessage?: string;
  uploadedAt: string;
  processedAt?: string;
  scripts?: Script[];
  audioFiles?: AudioFile[];
}

export interface Script {
  id: string;
  documentId: string;
  title: string;
  content: string;
  host1Name: string;
  host2Name: string;
  estimatedDuration?: number;
  wordCount?: number;
  createdAt: string;
}

export interface AudioFile {
  id: string;
  scriptId: string;
  documentId: string;
  audioPath: string;
  audioUrl?: string;
  duration?: number;
  fileSize?: number;
  format: string;
  status: AudioStatus;
  createdAt: string;
  completedAt?: string;
}

export interface DialogueLine {
  speaker: 'host1' | 'host2';
  speakerName: string;
  text: string;
}

export interface ScriptSegment {
  type: 'intro' | 'main' | 'outro';
  dialogue: DialogueLine[];
}

export interface ConversationalScript {
  title: string;
  hosts: {
    host1: string;
    host2: string;
  };
  segments: ScriptSegment[];
  estimatedDuration?: number;
  wordCount?: number;
}
