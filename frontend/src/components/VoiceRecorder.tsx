'use client';

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';
import { audioRecorder, isAudioSupported, requestMicrophonePermission } from '@/lib/audio';
import { VoiceRecording } from '@/types/chat';

interface VoiceRecorderProps {
  onRecordingComplete: (recording: VoiceRecording) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  disabled?: boolean;
  language?: 'en' | 'de';
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onRecordingStart,
  onRecordingStop,
  disabled = false,
  language = 'en'
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const isGerman = language === 'de';

  useEffect(() => {
    // Set client-side flag to prevent hydration mismatch
    setIsClient(true);

    // Check if audio is supported
    if (!isAudioSupported()) {
      setError(isGerman ? 'Audio wird nicht unterstützt' : 'Audio not supported');
      return;
    }

    // Check microphone permission
    requestMicrophonePermission().then(setHasPermission);
  }, [isGerman]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      setError(null);
      await audioRecorder.startRecording();
      setIsRecording(true);
      onRecordingStart?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recording failed');
    }
  };

  const stopRecording = async () => {
    try {
      const recording = await audioRecorder.stopRecording();
      setIsRecording(false);
      onRecordingStop?.();
      onRecordingComplete(recording);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
      setIsRecording(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Prevent hydration mismatch by showing loading state on server
  if (!isClient) {
    return (
      <div className="flex items-center space-x-2">
        <button
          type="button"
          disabled={true}
          className="p-2 rounded-full bg-gray-300 text-gray-500 cursor-not-allowed"
          title={isGerman ? 'Wird geladen...' : 'Loading...'}
        >
          <Mic size={20} />
        </button>
      </div>
    );
  }

  if (!isAudioSupported()) {
    return (
      <div className="text-sm text-gray-500">
        {isGerman ? 'Sprachaufnahme nicht verfügbar' : 'Voice recording not available'}
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <button
        type="button"
        onClick={() => requestMicrophonePermission().then(setHasPermission)}
        className="flex items-center space-x-2 px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm hover:bg-yellow-200 transition-colors"
      >
        <MicOff size={16} />
        <span>
          {isGerman ? 'Mikrofon-Berechtigung erforderlich' : 'Microphone permission required'}
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {error && (
        <div className="text-sm text-red-500 mr-2">
          {error}
        </div>
      )}

      {isRecording && (
        <div className="flex items-center space-x-2 text-sm text-red-600">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span>{formatTime(recordingTime)}</span>
        </div>
      )}

      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled || hasPermission === null}
        className={`p-2 rounded-full transition-all duration-200 ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
            : 'bg-blue-500 hover:bg-blue-600 text-white hover:scale-105'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title={
          isRecording
            ? (isGerman ? 'Aufnahme stoppen' : 'Stop recording')
            : (isGerman ? 'Aufnahme starten' : 'Start recording')
        }
      >
        {isRecording ? <Square size={20} /> : <Mic size={20} />}
      </button>
    </div>
  );
};

export default VoiceRecorder;
