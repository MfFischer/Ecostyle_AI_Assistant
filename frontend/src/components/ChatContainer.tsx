'use client';

import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, ChatState, VoiceRecording } from '@/types/chat';
import { chatApi } from '@/lib/api';
import { audioPlayer } from '@/lib/audio';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { Globe, Trash2, Wifi, WifiOff } from 'lucide-react';

export const ChatContainer: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatState, setChatState] = useState<ChatState>('idle');
  const [language, setLanguage] = useState<'en' | 'de'>('en');
  const [sessionId, setSessionId] = useState<string>('');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isClient, setIsClient] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initialize client-side only values
  useEffect(() => {
    setIsClient(true);
    setSessionId(uuidv4());
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check API connectivity
  useEffect(() => {
    const checkConnectivity = async () => {
      const isHealthy = await chatApi.healthCheck();
      setIsOnline(isHealthy);
    };

    checkConnectivity();
    const interval = setInterval(checkConnectivity, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Add welcome message (only on client side)
  useEffect(() => {
    if (!isClient) return;

    const welcomeMessage: Message = {
      id: uuidv4(),
      content: language === 'de'
        ? 'Hallo! Ich bin Ihr KI-Assistent. Wie kann ich Ihnen heute helfen? Sie können mit mir auf Deutsch oder Englisch sprechen.'
        : 'Hello! I\'m your AI assistant. How can I help you today? You can speak with me in German or English.',
      role: 'assistant',
      timestamp: new Date(),
      language,
    };

    setMessages([welcomeMessage]);
  }, [language, isClient]);

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: uuidv4(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const handleSendMessage = async (content: string) => {
    setChatState('processing');

    // Add user message
    const userMessage = addMessage({
      content,
      role: 'user',
      language,
    });

    try {
      // Detect language if auto-detection is enabled
      const detectedLanguage = await chatApi.detectLanguage(content);
      if (detectedLanguage !== language) {
        setLanguage(detectedLanguage);
      }

      // Send to API
      const startTime = Date.now();
      const response = await chatApi.sendTextMessage(content, detectedLanguage, sessionId);
      const processingTime = Date.now() - startTime;

      if (response.success) {
        // Add assistant response
        addMessage({
          content: response.message,
          role: 'assistant',
          language: response.language,
          hasAudio: !!response.audioUrl,
          audioUrl: response.audioUrl,
          processingTime: response.processingTime || processingTime,
        });
      } else {
        // Add error message
        addMessage({
          content: response.error || 'Sorry, I encountered an error processing your message.',
          role: 'assistant',
          language: detectedLanguage,
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage({
        content: language === 'de' 
          ? 'Entschuldigung, es gab einen Fehler bei der Verarbeitung Ihrer Nachricht.'
          : 'Sorry, there was an error processing your message.',
        role: 'assistant',
        language,
      });
    } finally {
      setChatState('idle');
    }
  };

  const handleSendVoiceMessage = async (recording: VoiceRecording) => {
    setChatState('processing');

    // Add user message placeholder
    const userMessage = addMessage({
      content: language === 'de' ? '[Sprachnachricht]' : '[Voice message]',
      role: 'user',
      language,
      isVoiceInput: true,
    });

    try {
      const startTime = Date.now();
      const response = await chatApi.sendVoiceMessage(recording.blob, language, sessionId);
      const processingTime = Date.now() - startTime;

      if (response.success) {
        // Add assistant response
        addMessage({
          content: response.message,
          role: 'assistant',
          language: response.language,
          hasAudio: !!response.audioUrl,
          audioUrl: response.audioUrl,
          processingTime: response.processingTime || processingTime,
        });
      } else {
        addMessage({
          content: response.error || 'Sorry, I encountered an error processing your voice message.',
          role: 'assistant',
          language,
        });
      }
    } catch (error) {
      console.error('Error sending voice message:', error);
      addMessage({
        content: language === 'de' 
          ? 'Entschuldigung, es gab einen Fehler bei der Verarbeitung Ihrer Sprachnachricht.'
          : 'Sorry, there was an error processing your voice message.',
        role: 'assistant',
        language,
      });
    } finally {
      setChatState('idle');
    }
  };

  const handlePlayAudio = async (audioUrl: string) => {
    try {
      setPlayingAudioId(audioUrl);
      setChatState('playing-audio');
      await audioPlayer.playAudio(audioUrl);
    } catch (error) {
      console.error('Error playing audio:', error);
    } finally {
      setPlayingAudioId(null);
      setChatState('idle');
    }
  };

  const clearChat = () => {
    setMessages([]);
    setChatState('idle');
    setPlayingAudioId(null);
    audioPlayer.stopAudio();
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'de' : 'en');
  };

  const isProcessing = chatState === 'processing';

  // Show loading until client is ready (prevents hydration errors)
  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-semibold text-gray-800">
            AI Assistant
          </h1>
          <div className={`flex items-center space-x-1 text-sm ${
            isOnline ? 'text-green-600' : 'text-red-600'
          }`}>
            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Language toggle */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center space-x-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
          >
            <Globe size={16} />
            <span className="uppercase font-mono">{language}</span>
          </button>

          {/* Clear chat */}
          <button
            type="button"
            onClick={clearChat}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title={language === 'de' ? 'Chat löschen' : 'Clear chat'}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onPlayAudio={handlePlayAudio}
            isPlayingAudio={playingAudioId === message.audioUrl}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onSendVoiceMessage={handleSendVoiceMessage}
        disabled={!isOnline}
        language={language}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default ChatContainer;
