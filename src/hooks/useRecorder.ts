
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FallbackMode, RecorderConfig } from '../types';
import { useAudioProcessor } from './useAudioProcessor';
import { saveMedia, loadAllMedia, deleteMediaItem, clearAllMedia, StoredMediaItem } from '../services/MediaStorageService';

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
  const [isPhotoCountingDown, setIsPhotoCountingDown] = useState(false);
  const [isBursting, setIsBursting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [photoCountdown, setPhotoCountdown] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [error, setError] = useState<FallbackMode | null>(null);

  const { processStream, cleanup: cleanupAudio } = useAudioProcessor();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const actualMimeTypeRef = useRef<string>('video/webm');
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const captureStreamRef = useRef<MediaStream | null>(null);
  const mediaItemsRef = useRef<MediaItem[]>([]);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  const [config, setConfig] = useState<RecorderConfig>({
      mimeType: 'video/webm;codecs=vp9',
      bitrate: 2500000,
      audioSource: 'none',
      countdown: 0,
      photoCountdown: 0,
      maxFileSize: 500 * 1024 * 1024,
      burstCount: 1,
      burstDelay: 200
  });

  const currentSizeRef = useRef<number>(0);

  // Load persisted media on mount
  useEffect(() => {
    loadAllMedia().then(stored => {
      const items = stored.map(s => ({
        id: s.id,
        url: URL.createObjectURL(s.blob),
        type: s.type,
        timestamp: s.timestamp
      }));
      setMediaItems(items);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    mediaItemsRef.current = mediaItems;
  }, [mediaItems]);

  // Create preview audio stream when audio source changes
  useEffect(() => {
    if (config.audioSource === 'none') {
      if (audioStreamRef.current) {
        stopStreamTracks(audioStreamRef.current);
        audioStreamRef.current = null;
      }
      setAudioStream(null);
      return;
    }

    const setupPreviewAudio = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          audio: config.audioSource === 'default' 
            ? true 
            : { deviceId: { ideal: config.audioSource } }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        audioStreamRef.current = stream;
        setAudioStream(stream);
      } catch (e) {
        console.warn("Failed to setup preview audio", e);
        setAudioStream(null);
      }
    };

    setupPreviewAudio();

    return () => {
      if (audioStreamRef.current && !isRecording) {
        stopStreamTracks(audioStreamRef.current);
        audioStreamRef.current = null;
        setAudioStream(null);
      }
    };
  }, [config.audioSource, isRecording]);

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
    setError(null);

    try {
      let stream = canvas.captureStream(60); 
      
      if (config.audioSource !== 'none') {
        try {
          const constraints: MediaStreamConstraints = {
            audio: config.audioSource === 'default' 
              ? true 
              : { deviceId: { ideal: config.audioSource } }
          };
          const recordAudioStream = await navigator.mediaDevices.getUserMedia(constraints);
          
          // Process audio through broadcast chain
          const processedAudio = processStream(recordAudioStream);
          
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
      
      // Codec capability check
      if (options.mimeType && !MediaRecorder.isTypeSupported(options.mimeType)) {
         console.warn(`${options.mimeType} not supported, trying fallback.`);
         options.mimeType = 'video/webm'; // fallback

         if (!MediaRecorder.isTypeSupported('video/webm')) {
             console.error("No supported MediaRecorder mimeType found.");
             setError(FallbackMode.RECORDING_FAILED);
             cleanupStreams();
             return;
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
        setError(FallbackMode.RECORDING_FAILED);
        cleanupTimer();
        cleanupStreams();
        setIsRecording(false);
        setRecordingTime(0);
      };

      recorder.onstop = () => {
        // Use actual mimeType from recorder
        const blob = new Blob(chunksRef.current, { type: actualMimeTypeRef.current });
        const url = URL.createObjectURL(blob);
        const id = Date.now().toString();
        const item = { id, url, type: 'video' as const, timestamp: Date.now() };
        
        setMediaItems(prev => [...prev, item]);
        saveMedia({ id, blob, type: 'video', timestamp: item.timestamp }).catch(console.error);
        
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
      setError(FallbackMode.RECORDING_FAILED);
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
        const id = Date.now().toString();
        const item = { id, url, type: 'image' as const, timestamp: Date.now() };
        setMediaItems(prev => [...prev, item]);
        saveMedia({ id, blob, type: 'image', timestamp: item.timestamp }).catch(console.error);
        onCapture?.(url);
      }
    }, 'image/png', 1.0);
  }, [canvasRef]);

  const playShutterSound = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 1200;
      gain.gain.value = 0.15;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) { /* ignore audio errors */ }
  }, []);

  const takeBurstInternal = useCallback((onCapture?: (url: string) => void) => {
    if (config.burstCount <= 1) {
      playShutterSound();
      takeScreenshot(onCapture);
      return;
    }
    setIsBursting(true);
    let taken = 0;
    const interval = setInterval(() => {
      playShutterSound();
      takeScreenshot(taken === 0 ? onCapture : undefined);
      taken++;
      if (taken >= config.burstCount) {
        clearInterval(interval);
        setIsBursting(false);
      }
    }, config.burstDelay);
  }, [config.burstCount, config.burstDelay, takeScreenshot, playShutterSound]);

  const takeBurst = useCallback((onCapture?: (url: string) => void) => {
    const countdownTime = Number(config.photoCountdown) || 0;
    if (countdownTime > 0) {
      setIsPhotoCountingDown(true);
      setPhotoCountdown(countdownTime);
      let remaining = countdownTime;
      const interval = setInterval(() => {
        remaining -= 1;
        setPhotoCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
          setIsPhotoCountingDown(false);
          takeBurstInternal(onCapture);
        }
      }, 1000);
    } else {
      takeBurstInternal(onCapture);
    }
  }, [config.photoCountdown, takeBurstInternal]);

  const deleteMedia = useCallback((id: string) => {
    setMediaItems(prev => {
      const item = prev.find(i => i.id === id);
      revokeBlobUrl(item);
      return prev.filter(i => i.id !== id);
    });
    deleteMediaItem(id).catch(console.error);
  }, []);

  const clearMedia = useCallback(() => {
    setMediaItems(prev => {
      revokeBlobUrls(prev);
      return [];
    });
    clearAllMedia().catch(console.error);
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
    isPhotoCountingDown,
    isBursting,
    countdown,
    photoCountdown,
    recordingTime,
    config,
    setConfig,
    startRecording: startWithCountdown,
    stopRecording,
    takeScreenshot,
    takeBurst,
    mediaItems,
    deleteMedia,
    clearMedia,
    audioStream,
    error // Return error state
  };
};
