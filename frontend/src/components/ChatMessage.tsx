'use client';

import React from 'react';
import { Message } from '@/types/chat';
import { Play, Pause, Mic, Clock } from 'lucide-react';
import { audioPlayer } from '@/lib/audio';

interface ChatMessageProps {
  message: Message;
  onPlayAudio?: (audioUrl: string) => void;
  isPlayingAudio?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  onPlayAudio,
  isPlayingAudio = false 
}) => {
  const isUser = message.role === 'user';
  const isGerman = message.language === 'de';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handlePlayAudio = () => {
    if (message.audioUrl && onPlayAudio) {
      onPlayAudio(message.audioUrl);
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isUser 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-200 text-gray-800'
      }`}>
        {/* Message content */}
        <div className="mb-1">
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>

        {/* Message metadata */}
        <div className="flex items-center justify-between text-xs opacity-75 mt-2">
          <div className="flex items-center space-x-2">
            {/* Voice input indicator */}
            {message.isVoiceInput && (
              <div className="flex items-center space-x-1">
                <Mic size={12} />
                <span>{isGerman ? 'Sprache' : 'Voice'}</span>
              </div>
            )}

            {/* Language indicator */}
            <span className="uppercase font-mono">
              {message.language || 'en'}
            </span>

            {/* Processing time */}
            {message.processingTime && (
              <div className="flex items-center space-x-1">
                <Clock size={12} />
                <span>{message.processingTime}ms</span>
              </div>
            )}
          </div>

          {/* Timestamp */}
          <span>{formatTime(message.timestamp)}</span>
        </div>

        {/* Audio playback button */}
        {message.hasAudio && message.audioUrl && (
          <div className="mt-2 pt-2 border-t border-opacity-20 border-white">
            <button
              onClick={handlePlayAudio}
              className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs transition-colors ${
                isUser
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
              }`}
              disabled={isPlayingAudio}
            >
              {isPlayingAudio ? (
                <>
                  <Pause size={12} />
                  <span>{isGerman ? 'Pausieren' : 'Pause'}</span>
                </>
              ) : (
                <>
                  <Play size={12} />
                  <span>{isGerman ? 'Anhören' : 'Play'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
