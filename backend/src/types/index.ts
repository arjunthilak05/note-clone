// Document types
export interface DocumentMetadata {
  pages: number;
  author?: string;
  title?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
}

export interface ExtractedContent {
  text: string;
  metadata: DocumentMetadata;
  pageCount: number;
}

// Script generation types
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

// Content summary types
export interface ContentChunk {
  topic: string;
  content: string;
  keyPoints: string[];
}

export interface DocumentSummary {
  title: string;
  overallSummary: string;
  chunks: ContentChunk[];
  mainTopics: string[];
  keyTerms: string[];
}

// TTS types
export interface TTSOptions {
  voiceId: string;
  speed?: number;
  stability?: number;
  similarityBoost?: number;
}

export interface AudioSegment {
  speaker: 'host1' | 'host2';
  text: string;
  audioBuffer: Buffer;
  duration?: number;
}

// Job types
export interface PDFProcessingJobData {
  documentId: string;
  filePath: string;
  originalFilename: string;
}

export interface JobProgress {
  step: 'extracting' | 'summarizing' | 'generating_script' | 'generating_audio' | 'completed';
  progress: number;
  message: string;
}
