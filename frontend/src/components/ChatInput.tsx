'use client';

import React, { useState, useRef, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';
import { VoiceRecording } from '@/types/chat';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onSendVoiceMessage: (recording: VoiceRecording) => void;
  disabled?: boolean;
  language?: 'en' | 'de';
  isProcessing?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onSendVoiceMessage,
  disabled = false,
  language = 'en',
  isProcessing = false
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isGerman = language === 'de';
  const maxLength = 1000;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled && !isProcessing) {
      onSendMessage(message.trim());
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const handleVoiceRecordingComplete = (recording: VoiceRecording) => {
    setIsRecording(false);
    onSendVoiceMessage(recording);
  };

  const handleRecordingStart = () => {
    setIsRecording(true);
  };

  const handleRecordingStop = () => {
    setIsRecording(false);
  };

  const placeholder = isGerman 
    ? 'Schreiben Sie Ihre Nachricht hier...' 
    : 'Type your message here...';

  const sendButtonText = isGerman ? 'Senden' : 'Send';

  return (
    <div className="border-t bg-white p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        {/* Text input area */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || isProcessing || isRecording}
            maxLength={maxLength}
            rows={1}
            className={`w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              disabled || isProcessing || isRecording 
                ? 'bg-gray-100 cursor-not-allowed' 
                : 'bg-white'
            }`}
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          
          {/* Character counter */}
          <div className="absolute bottom-1 right-2 text-xs text-gray-400">
            {message.length}/{maxLength}
          </div>
        </div>

        {/* Voice recorder */}
        <VoiceRecorder
          onRecordingComplete={handleVoiceRecordingComplete}
          onRecordingStart={handleRecordingStart}
          onRecordingStop={handleRecordingStop}
          disabled={disabled || isProcessing}
          language={language}
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={!message.trim() || disabled || isProcessing || isRecording}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
            !message.trim() || disabled || isProcessing || isRecording
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600 hover:scale-105'
          }`}
          style={{ minHeight: '44px' }}
        >
          {isProcessing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span className="hidden sm:inline">
                {isGerman ? 'Verarbeitung...' : 'Processing...'}
              </span>
            </>
          ) : (
            <>
              <Send size={18} />
              <span className="hidden sm:inline">{sendButtonText}</span>
            </>
          )}
        </button>
      </form>

      {/* Recording indicator */}
      {isRecording && (
        <div className="mt-2 flex items-center justify-center space-x-2 text-red-600">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm">
            {isGerman ? 'Aufnahme läuft...' : 'Recording...'}
          </span>
        </div>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <div className="mt-2 flex items-center justify-center space-x-2 text-blue-600">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">
            {isGerman ? 'Nachricht wird verarbeitet...' : 'Processing message...'}
          </span>
        </div>
      )}
    </div>
  );
};

export default ChatInput;
