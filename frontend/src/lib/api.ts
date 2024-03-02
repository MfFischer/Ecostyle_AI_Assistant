import { ApiResponse } from '@/types/chat';

const API_BASE_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/test-chat';

export class ChatApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async sendTextMessage(
    message: string, 
    language: 'en' | 'de' = 'en',
    sessionId?: string
  ): Promise<ApiResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'text',
          message,
          language,
          sessionId,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: data.response || data.message,
        language: data.language || language,
        audioUrl: data.audioUrl,
        processingTime: data.processingTime,
      };
    } catch (error) {
      console.error('Error sending text message:', error);
      return {
        success: false,
        message: 'Sorry, I encountered an error processing your message.',
        language,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendVoiceMessage(
    audioBlob: Blob,
    language: 'en' | 'de' = 'en',
    sessionId?: string
  ): Promise<ApiResponse> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-message.wav');
      formData.append('type', 'voice');
      formData.append('language', language);
      formData.append('timestamp', new Date().toISOString());
      if (sessionId) {
        formData.append('sessionId', sessionId);
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: data.response || data.message,
        language: data.language || language,
        audioUrl: data.audioUrl,
        processingTime: data.processingTime,
      };
    } catch (error) {
      console.error('Error sending voice message:', error);
      return {
        success: false,
        message: 'Sorry, I encountered an error processing your voice message.',
        language,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async detectLanguage(text: string): Promise<'en' | 'de'> {
    // Simple language detection based on common words
    const germanWords = ['der', 'die', 'das', 'und', 'ist', 'haben', 'sie', 'ich', 'mit', 'für', 'auf', 'von', 'zu', 'ein', 'eine'];
    const englishWords = ['the', 'and', 'is', 'have', 'you', 'i', 'with', 'for', 'on', 'from', 'to', 'a', 'an'];
    
    const words = text.toLowerCase().split(/\s+/);
    let germanScore = 0;
    let englishScore = 0;

    words.forEach(word => {
      if (germanWords.includes(word)) germanScore++;
      if (englishWords.includes(word)) englishScore++;
    });

    return germanScore > englishScore ? 'de' : 'en';
  }

  async healthCheck(): Promise<boolean> {
    // Skip health check for now - main webhook is working
    return true;
  }
}

export const chatApi = new ChatApiClient();
