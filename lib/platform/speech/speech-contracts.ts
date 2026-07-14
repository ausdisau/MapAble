export type SpeechRecognitionStatus =
  | "idle"
  | "listening"
  | "processing"
  | "error"
  | "unsupported";

export interface SpeechTranscript {
  text: string;
  confidence: number;
  isFinal: boolean;
  timestamp: string;
}

export interface SpeechRecognitionProvider {
  readonly name: string;
  isSupported(): boolean;
  start(): Promise<void>;
  stop(): Promise<void>;
  onTranscript(callback: (transcript: SpeechTranscript) => void): () => void;
}

export interface SpeechSynthesisRequest {
  text: string;
  rate?: number;
  pitch?: number;
  lang?: string;
}

export interface SpeechSynthesisProvider {
  readonly name: string;
  isSupported(): boolean;
  speak(request: SpeechSynthesisRequest): Promise<void>;
  cancel(): void;
}
