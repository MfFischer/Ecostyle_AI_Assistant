export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  language?: 'en' | 'de';
  hasAudio?: boolean;
  audioUrl?: string;
  isVoiceInput?: boolean;
  processingTime?: number;
}

export interface ChatSession {
  id: string;
  messages: Message[];
  language: 'en' | 'de';
  createdAt: Date;
  lastActivity: Date;
}

export interface VoiceRecording {
  blob: Blob;
  duration: number;
  url: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  language: 'en' | 'de';
  audioUrl?: string;
  processingTime?: number;
  error?: string;
}

export interface ChatConfig {
  n8nWebhookUrl: string;
  maxMessageLength: number;
  supportedLanguages: ('en' | 'de')[];
  voiceEnabled: boolean;
}

export type ChatState = 'idle' | 'typing' | 'recording' | 'processing' | 'playing-audio';

export interface ChatContextType {
  messages: Message[];
  currentSession: ChatSession | null;
  chatState: ChatState;
  language: 'en' | 'de';
  sendMessage: (content: string, isVoiceInput?: boolean) => Promise<void>;
  sendVoiceMessage: (audioBlob: Blob) => Promise<void>;
  setLanguage: (language: 'en' | 'de') => void;
  clearChat: () => void;
  playAudio: (audioUrl: string) => Promise<void>;
}
