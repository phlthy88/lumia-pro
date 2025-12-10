
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FallbackMode, RecorderConfig, AudioConfig } from '../types';
import { useAudioProcessor } from './useAudioProcessor';
import { saveMedia, loadMediaMetadata, loadMediaBlob, deleteMediaItem, clearAllMedia } from '../services/MediaStorageService';

interface MediaItem {
  id: string;
  url: string; // Empty string until loaded
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

// Limit stored media to prevent memory bloat
const MAX_MEDIA_ITEMS = 50;

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

  const [audioConfig, setAudioConfig] = useState<AudioConfig>({
      noiseSuppression: true,
      echoCancellation: true,
      autoGainControl: true,
      sampleRate: 48000,
      channelCount: 1,
      preset: 'video_conference'
  });

  const currentSizeRef = useRef<number>(0);

  // Load only metadata on mount - blobs loaded on demand
  useEffect(() => {
    loadMediaMetadata().then(meta => {
      const sorted = meta.sort((a, b) => b.timestamp - a.timestamp).slice(0, MAX_MEDIA_ITEMS);
      const items = sorted.map(m => ({ id: m.id, url: '', type: m.type, timestamp: m.timestamp }));
      setMediaItems(items.reverse());
    }).catch(console.error);
  }, []);

  // Lazy-load blob URL for a specific item
  const loadItemUrl = useCallback(async (id: string): Promise<string> => {
    const existing = mediaItemsRef.current.find(i => i.id === id);
    if (existing?.url) return existing.url;
    
    const blob = await loadMediaBlob(id);
    if (!blob) return '';
    
    const url = URL.createObjectURL(blob);
    setMediaItems(prev => prev.map(i => i.id === id ? { ...i, url } : i));
    return url;
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
        const audioConstraints: MediaTrackConstraints = {
          ...(config.audioSource !== 'default' && { deviceId: { ideal: config.audioSource } }),
          noiseSuppression: audioConfig.noiseSuppression,
          echoCancellation: audioConfig.echoCancellation,
          autoGainControl: audioConfig.autoGainControl,
          sampleRate: audioConfig.sampleRate,
          channelCount: audioConfig.channelCount,
        };
        const constraints: MediaStreamConstraints = { audio: audioConstraints };
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
  }, [config.audioSource, audioConfig, isRecording]);

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

  const captureFrame = useCallback(
    async (type: 'image/png' | 'image/jpeg', quality = 1.0): Promise<{ blob: Blob; url: string } | null> => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      if (canvas.width === 0 || canvas.height === 0) return null;

      await new Promise(requestAnimationFrame);

      return new Promise(resolve => {
        canvas.toBlob((blob) => {
          if (!blob || blob.size === 0) {
            resolve(null);
            return;
          }
          const url = URL.createObjectURL(blob);
          resolve({ blob, url });
        }, type, quality);
      });
    },
    [canvasRef]
  );

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
          const audioConstraints: MediaTrackConstraints = {
            ...(config.audioSource !== 'default' && { deviceId: { ideal: config.audioSource } }),
            noiseSuppression: audioConfig.noiseSuppression,
            echoCancellation: audioConfig.echoCancellation,
            autoGainControl: audioConfig.autoGainControl,
            sampleRate: audioConfig.sampleRate,
            channelCount: audioConfig.channelCount,
          };
          const constraints: MediaStreamConstraints = { audio: audioConstraints };
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
        
        setMediaItems(prev => {
          if (prev.length >= MAX_MEDIA_ITEMS) {
            const oldest = prev[0];
            if (oldest) {
              revokeBlobUrl(oldest);
              deleteMediaItem(oldest.id).catch(console.error);
            }
            return [...prev.slice(1), item];
          }
          return [...prev, item];
        });
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

  const stopRecording = useCallback(
    (onThumbnail?: (url: string) => void) => {
      cleanupTimer();

      const finalizeStop = () => {
        cleanupStreams();
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setRecordingTime(0);
      };

      const capturePromise = onThumbnail ? captureFrame('image/jpeg', 0.8) : Promise.resolve(null);

      capturePromise
        .then(result => {
          if (result) {
            onThumbnail?.(result.url);
          }
        })
        .finally(finalizeStop);
    },
    [captureFrame, cleanupStreams, cleanupTimer]
  );

  const takeScreenshot = useCallback(
    (onCapture?: (url: string) => void) => {
      captureFrame('image/png', 1.0).then(result => {
        if (!result) return;

        const { blob, url } = result;
        const id = Date.now().toString();
        const item = { id, url, type: 'image' as const, timestamp: Date.now() };
        setMediaItems(prev => {
          if (prev.length >= MAX_MEDIA_ITEMS) {
            const oldest = prev[0];
            if (oldest) {
              revokeBlobUrl(oldest);
              deleteMediaItem(oldest.id).catch(console.error);
            }
            return [...prev.slice(1), item];
          }
          return [...prev, item];
        });
        saveMedia({ id, blob, type: 'image', timestamp: item.timestamp }).catch(console.error);
        onCapture?.(url);
      });
    },
    [captureFrame]
  );

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

  const cancelCountdown = useCallback(() => {
    setIsCountingDown(false);
    setIsPhotoCountingDown(false);
    setIsBursting(false);
    setCountdown(0);
    setPhotoCountdown(0);
  }, []);

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
    audioConfig,
    setAudioConfig,
    startRecording: startWithCountdown,
    stopRecording,
    takeScreenshot,
    takeBurst,
    cancelCountdown,
    mediaItems,
    loadItemUrl,
    deleteMedia,
    clearMedia,
    audioStream,
    error // Return error state
  };
};
