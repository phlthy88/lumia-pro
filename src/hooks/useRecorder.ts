
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { RecorderConfig } from '../types';
import { useAudioProcessor } from './useAudioProcessor';

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  timestamp: number;
}

const stopStreamTracks = (stream: MediaStream | null) => {
  if (!stream) return;
  stream.getTracks().forEach(track => track.stop());
};

const revokeBlobUrl = (item: MediaItem | undefined) => {
  if (item && item.url.startsWith('blob:')) {
    URL.revokeObjectURL(item.url);
  }
};

const revokeBlobUrls = (items: MediaItem[]) => {
  items.forEach(revokeBlobUrl);
};

export const useRecorder = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  
  const { processStream, cleanup: cleanupAudio } = useAudioProcessor();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const actualMimeTypeRef = useRef<string>('video/webm');
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const captureStreamRef = useRef<MediaStream | null>(null);
  const mediaItemsRef = useRef<MediaItem[]>([]);

  const [config, setConfig] = useState<RecorderConfig>({
      mimeType: 'video/webm;codecs=vp9',
      bitrate: 2500000,
      audioSource: 'none',
      countdown: 0,
      maxFileSize: 500 * 1024 * 1024
  });

  const currentSizeRef = useRef<number>(0);

  useEffect(() => {
    mediaItemsRef.current = mediaItems;
  }, [mediaItems]);

  // Cleanup helper for streams
  const cleanupStreams = useCallback(() => {
    if (audioStreamRef.current) {
      stopStreamTracks(audioStreamRef.current);
      audioStreamRef.current = null;
    }
    if (captureStreamRef.current) {
      stopStreamTracks(captureStreamRef.current);
      captureStreamRef.current = null;
    }
  }, []);

  // Cleanup helper for timer
  const cleanupTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Clean up any previous streams first
    cleanupStreams();
    cleanupTimer();

    try {
      let stream = canvas.captureStream(60); 
      
      if (config.audioSource !== 'none') {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: config.audioSource } }
          });
          audioStreamRef.current = audioStream;
          
          // Process audio through broadcast chain
          const processedAudio = processStream(audioStream);
          
          stream = new MediaStream([
            ...stream.getVideoTracks(),
            ...processedAudio.getAudioTracks()
          ]);
        } catch (e) {
          console.warn("Failed to capture audio", e);
        }
      }

      captureStreamRef.current = stream;

      const options: MediaRecorderOptions = { 
        mimeType: config.mimeType,
        videoBitsPerSecond: config.bitrate
      };
      
      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
        console.warn(`${options.mimeType} not supported, falling back.`);
        options.mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = undefined;
        }
      }

      const recorder = new MediaRecorder(stream, options);
      // Store actual mimeType from recorder
      actualMimeTypeRef.current = recorder.mimeType || 'video/webm';
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          currentSizeRef.current += e.data.size;
          
          if (config.maxFileSize && currentSizeRef.current >= config.maxFileSize) {
            console.warn('Max file size reached, stopping recording');
            recorder.stop();
          }
        }
      };

      recorder.onerror = () => {
        console.error('MediaRecorder error');
        cleanupTimer();
        cleanupStreams();
        setIsRecording(false);
        setRecordingTime(0);
      };

      recorder.onstop = () => {
        // Use actual mimeType from recorder
        const blob = new Blob(chunksRef.current, { type: actualMimeTypeRef.current });
        const url = URL.createObjectURL(blob);
        
        setMediaItems(prev => [...prev, {
          id: Date.now().toString(),
          url,
          type: 'video',
          timestamp: Date.now()
        }]);
        
        chunksRef.current = [];
        currentSizeRef.current = 0;
        cleanupStreams();
      };

      recorder.start(100); 
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      
      const startTime = Date.now();
      timerRef.current = window.setInterval(() => {
        setRecordingTime((Date.now() - startTime) / 1000);
      }, 100);

    } catch (e) {
      console.error("Recording failed to start", e);
      cleanupTimer();
      cleanupStreams();
    }
  }, [canvasRef, config, cleanupStreams, cleanupTimer]);

  const startWithCountdown = useCallback(() => {
    if (config.countdown > 0) {
      setIsCountingDown(true);
      setCountdown(config.countdown);
    } else {
      startRecording();
    }
  }, [config.countdown, startRecording]);

  const startRecordingRef = useRef(startRecording);
  useEffect(() => {
    startRecordingRef.current = startRecording;
  }, [startRecording]);

  useEffect(() => {
    if (isCountingDown && countdown > 0) {
      const id = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(id);
    } else if (isCountingDown && countdown === 0) {
      setIsCountingDown(false);
      startRecordingRef.current();
    }
    return undefined;
  }, [isCountingDown, countdown]);

  const stopRecording = useCallback((onThumbnail?: (url: string) => void) => {
    cleanupTimer();
    
    // Capture thumbnail before stopping
    if (onThumbnail && canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const thumbUrl = URL.createObjectURL(blob);
          onThumbnail(thumbUrl);
        }
      }, 'image/jpeg', 0.8);
    }
    
    // Stop streams immediately to prevent stacking
    cleanupStreams();
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingTime(0);
  }, [cleanupTimer, cleanupStreams, canvasRef]);

  const takeScreenshot = useCallback((onCapture?: (url: string) => void) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setMediaItems(prev => [...prev, {
          id: Date.now().toString(),
          url,
          type: 'image',
          timestamp: Date.now()
        }]);
        onCapture?.(url);
      }
    }, 'image/png', 1.0);
  }, [canvasRef]);

  const deleteMedia = useCallback((id: string) => {
    setMediaItems(prev => {
      const item = prev.find(i => i.id === id);
      revokeBlobUrl(item);
      return prev.filter(i => i.id !== id);
    });
  }, []);

  const clearMedia = useCallback(() => {
    setMediaItems(prev => {
      revokeBlobUrls(prev);
      return [];
    });
  }, []);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
      cleanupTimer();
      cleanupStreams();
      cleanupAudio();
      revokeBlobUrls(mediaItemsRef.current);
      chunksRef.current = [];
      currentSizeRef.current = 0;
    };
  }, [cleanupTimer, cleanupStreams, cleanupAudio]);

  return {
    isRecording,
    isCountingDown,
    countdown,
    recordingTime,
    config,
    setConfig,
    startRecording: startWithCountdown,
    stopRecording,
    takeScreenshot,
    mediaItems,
    deleteMedia,
    clearMedia,
    audioStream: audioStreamRef.current,
  };
};
