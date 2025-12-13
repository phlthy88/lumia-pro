import React, { createContext, useContext, useEffect, ReactNode, useRef, useState, useCallback } from 'react';
import { useRenderContext } from '../controllers/RenderController';
import { eventBus } from '../providers/EventBus';
import { MuiRecorderSettings } from '../components/MuiRecorderSettings';
import { Box, Typography } from '@mui/material';
import { useVideoRecorder } from '../hooks/useVideoRecorder';
import { useCapture } from '../hooks/useCapture';
import { useResourceManager } from '../hooks/useResourceManager';
import { mediaStorage, MediaItemMetadata } from '../services/MediaStorageService';
import { getCSPSafeBlobURL, revokeCSPAwareBlobURL } from '../utils/CSPUtils'; // Assuming these exist from previous useRecorder
import { RecorderConfig, AudioConfig } from '../types';

// Countdown Overlay
const CountdownOverlay: React.FC<{ count: number; type: 'video' | 'photo' }> = ({ count, type }) => {
    const audioCtxRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioContext();
        }
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = count === 1 ? 880 : 440;
        gain.gain.value = 0.3;
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.stop(ctx.currentTime + 0.15);

        return () => { osc.disconnect(); gain.disconnect(); };
    }, [count]);

    return (
        <Box
            sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
                zIndex: 9999
            }}
        >
            <Typography
                variant="h1"
                sx={{
                    fontSize: '12rem',
                    fontWeight: 900,
                    color: 'white',
                    textShadow: '0 0 40px rgba(255,255,255,0.5)',
                    animation: 'pulse 1s ease-in-out',
                    '@keyframes pulse': {
                        '0%': { transform: 'scale(0.8)', opacity: 0 },
                        '50%': { transform: 'scale(1.1)' },
                        '100%': { transform: 'scale(1)', opacity: 1 },
                    }
                }}
            >
                {count}
            </Typography>
            <Typography variant="h6" color="grey.400" sx={{ mt: 2 }}>
                {type === 'video' ? '🎬 Recording starts...' : '📸 Capturing...'}
            </Typography>
        </Box>
    );
};


interface RecordingContextState {
  isRecording: boolean;
  isCountingDown: boolean;
  isPhotoCountingDown: boolean;
  isBursting: boolean;
  countdown: number;
  photoCountdown: number;
  recordingTime: number; // This will map to useVideoRecorder's duration
  config: RecorderConfig;
  setConfig: React.Dispatch<React.SetStateAction<RecorderConfig>>;
  audioConfig: AudioConfig;
  setAudioConfig: React.Dispatch<React.SetStateAction<AudioConfig>>;
  startRecording: () => void;
  stopRecording: (cb?: (url: string) => void) => void;
  takeScreenshot: () => void;
  takeBurst: (cb: (url: string) => void) => void;
  cancelCountdown: () => void;
  mediaItems: (MediaItemMetadata & { url?: string })[]; // Add optional url for display
  loadItemUrl: (id: string) => Promise<string>;
  deleteMedia: (id: string) => void;
  clearMedia: () => void;
  audioStream: MediaStream | null;
  error: Error | null | any; // Use a more specific type if possible
}

const RecordingContext = createContext<RecordingContextState | null>(null);

export const useRecordingContext = () => {
  const context = useContext(RecordingContext);
  if (!context) throw new Error('useRecordingContext must be used within RecordingController');
  return context;
};

interface RecordingControllerProps {
  children?: ReactNode;
}

import { usePerformanceModeContext } from '../providers/PerformanceModeProvider';

const MAX_MEDIA_ITEMS = 50; // Keep a limit as useRecorder did

export const RecordingController: React.FC<RecordingControllerProps> = ({ children }) => {
  const { canvasRef, triggerCaptureAnim, triggerSwooshAnim, currentStream } = useRenderContext();
  const { targetFPS } = usePerformanceModeContext();

  const resourceManager = useResourceManager();
  const [mediaItems, setMediaItems] = useState<(MediaItemMetadata & { url?: string })[]>([]);
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
  const [recorderError, setRecorderError] = useState<Error | null>(null);

  // Initialize media items from storage
  useEffect(() => {
    const loadItems = async () => {
      const storedMetadata = await mediaStorage.listMetadata();
      const itemsWithUrls = storedMetadata
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, MAX_MEDIA_ITEMS)
        .map(item => ({ ...item, url: undefined })); // URL will be loaded on demand
      setMediaItems(itemsWithUrls.reverse());
    };
    loadItems();
  }, []);

  const loadItemUrl = useCallback(async (id: string): Promise<string> => {
    const existing = mediaItems.find(i => i.id === id);
    if (existing?.url) return existing.url;

    const blob = await mediaStorage.getBlob(id);
    if (!blob) return '';

    const url = await getCSPSafeBlobURL(blob);
    if (url) {
      resourceManager.register('blob-url', url, () => revokeCSPAwareBlobURL(url));
      setMediaItems(prev => prev.map(i => i.id === id ? { ...i, url } : i));
      return url;
    }
    return '';
  }, [mediaItems, resourceManager]);

  const deleteMedia = useCallback(async (id: string) => {
    await mediaStorage.deleteBlob(id);
    setMediaItems(prev => prev.filter(item => item.id !== id));
    // Resource manager cleanup will happen on unmount or if we explicitly unregister the URL
    // For now, let's assume blob URLs registered are short-lived or handled by resource manager on unmount
  }, []);

  const clearMedia = useCallback(async () => {
    await mediaStorage.clear();
    setMediaItems([]);
    // ResourceManager will handle cleanup of associated blob URLs on its unmount
  }, []);

    const audioStream = currentStream ? new MediaStream(currentStream.getAudioTracks()) : null;

  // useVideoRecorder hook
  const {
    isRecording,
    duration: recordingTime,
    startRecording: startVideoRecording,
    stopRecording: stopVideoRecording,
  } = useVideoRecorder({
    canvasRef,
    audioStream,
    config: {
      mimeType: config.mimeType,
      videoBitrate: config.bitrate,
    },
    onError: setRecorderError,
  });

  const [isRecordingCountdown, setIsRecordingCountdown] = useState(false);
  const [recordingCountdownValue, setRecordingCountdownValue] = useState(0);
  const recordingCountdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(() => {
    const countdownSeconds = config.countdown || 0;
    if (countdownSeconds > 0) {
      setIsRecordingCountdown(true);
      setRecordingCountdownValue(countdownSeconds);

      let remaining = countdownSeconds;
      if (recordingCountdownTimerRef.current) clearTimeout(recordingCountdownTimerRef.current);

      const tick = () => {
        remaining -= 1;
        setRecordingCountdownValue(remaining);
        if (remaining <= 0) {
          setIsRecordingCountdown(false);
          startVideoRecording();
        } else {
          recordingCountdownTimerRef.current = setTimeout(tick, 1000);
        }
      };
      recordingCountdownTimerRef.current = setTimeout(tick, 1000);
    } else {
      startVideoRecording();
    }
  }, [config.countdown, startVideoRecording]);

  const stopRecording = useCallback(async (cb?: (url: string) => void) => {
    if (recordingCountdownTimerRef.current) {
        clearTimeout(recordingCountdownTimerRef.current);
        setIsRecordingCountdown(false);
    }
    const blob = await stopVideoRecording();
    if (blob) {
      const id = crypto.randomUUID();
      const metadata: Omit<MediaItemMetadata, 'id'> = {
        type: 'video',
        timestamp: Date.now(),
        size: blob.size,
        duration: recordingTime,
        mimeType: blob.type,
      };
      await mediaStorage.saveBlob(id, blob, metadata);
      setMediaItems(prev => [{ ...metadata, id, url: undefined }, ...prev.filter((_, idx) => idx < MAX_MEDIA_ITEMS - 1)]);
      const url = await getCSPSafeBlobURL(blob);
      if (url) {
          resourceManager.register('blob-url', url, () => revokeCSPAwareBlobURL(url));
          cb?.(url);
      } else {
          cb?.(''); // Call callback with empty string or handle error
      }
    }
  }, [stopVideoRecording, recordingTime, resourceManager]);

  const cancelCountdown = useCallback(() => {
    if (recordingCountdownTimerRef.current) {
        clearTimeout(recordingCountdownTimerRef.current);
        recordingCountdownTimerRef.current = null;
    }
    setIsRecordingCountdown(false);
    // Potentially cancel photo countdown too if it was tied to this
  }, []);

  // useCapture hook
  const {
    countdown: photoCountdown,
    isBursting,
    takeScreenshot: takePhotoScreenshot,
    startCountdown: startPhotoCountdown,
    startBurst: startPhotoBurst,
  } = useCapture({
    canvasRef,
    onCapture: async (blob: Blob) => {
      const id = crypto.randomUUID();
      const metadata: Omit<MediaItemMetadata, 'id'> = {
        type: 'image',
        timestamp: Date.now(),
        size: blob.size,
        mimeType: blob.type,
      };
      await mediaStorage.saveBlob(id, blob, metadata);
      setMediaItems(prev => [{ ...metadata, id, url: undefined }, ...prev.filter((_, idx) => idx < MAX_MEDIA_ITEMS - 1)]);
      const url = await getCSPSafeBlobURL(blob);
      if (url) {
          resourceManager.register('blob-url', url, () => revokeCSPAwareBlobURL(url));
          triggerCaptureAnim(url);
          triggerSwooshAnim(url);
      }
    },
    shutter: () => { /* Play shutter sound */ },
  });

  const [isPhotoCountingDown, setIsPhotoCountingDown] = useState(false);
  const photoCountdownRef = useRef<number>(0); // Value of countdown
  const photoCountdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const takeScreenshot = useCallback(() => {
    const countdownSeconds = config.photoCountdown || 0;
    if (countdownSeconds > 0) {
      setIsPhotoCountingDown(true);
      photoCountdownRef.current = countdownSeconds; // Set initial value for display

      if (photoCountdownTimerRef.current) clearTimeout(photoCountdownTimerRef.current);

      const tick = () => {
        photoCountdownRef.current -= 1;
        if (photoCountdownRef.current <= 0) {
          setIsPhotoCountingDown(false);
          takePhotoScreenshot();
        } else {
          photoCountdownTimerRef.current = setTimeout(tick, 1000);
        }
      };
      photoCountdownTimerRef.current = setTimeout(tick, 1000);
    } else {
      takePhotoScreenshot();
    }
  }, [config.photoCountdown, takePhotoScreenshot]);

  const takeBurst = useCallback(async (cb: (url: string) => void) => {
    // startPhotoBurst handles saving and triggering anims directly
    // The cb here might be for external notification, so we call it with a dummy URL or actual one if available
    await startPhotoBurst(config.burstCount || 1, config.burstDelay || 100);
    // After burst, fetch latest item for cb, this is a simplification
    const latestItem = mediaItems[0]; 
    if(latestItem) {
        const url = await loadItemUrl(latestItem.id);
        cb?.(url);
    }
  }, [startPhotoBurst, config.burstCount, config.burstDelay, mediaItems, loadItemUrl]);

  // Listen to EventBus triggers
  useEffect(() => {
    const cleanupToggle = eventBus.on('recording:toggle' as any, () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    });

    const cleanupSnapshot = eventBus.on('recording:snapshot' as any, () => {
        takeBurst(() => {}); // Callback is handled internally by takePhotoScreenshot onCapture
    });

    return () => {
        cleanupToggle();
        cleanupSnapshot();
    };
  }, [isRecording, startRecording, stopRecording, takeBurst]);

  // Emit status
  useEffect(() => {
    if (isRecording) eventBus.emit('recording:start', undefined);
  }, [isRecording]);

  useEffect(() => {
    return () => {
        if (recordingCountdownTimerRef.current) clearTimeout(recordingCountdownTimerRef.current);
        if (photoCountdownTimerRef.current) clearTimeout(photoCountdownTimerRef.current);
    }
  }, []);


  return (
    <RecordingContext.Provider value={{
      isRecording, 
      isCountingDown: isRecordingCountdown, 
      isPhotoCountingDown, 
      isBursting, 
      countdown: recordingCountdownValue, 
      photoCountdown: photoCountdownRef.current, 
      recordingTime, 
      config, setConfig,
      audioConfig, setAudioConfig,
      startRecording, stopRecording, takeScreenshot, takeBurst, cancelCountdown, mediaItems, loadItemUrl, deleteMedia, clearMedia, audioStream, error: recorderError
    }}>
      {children}
      {(isRecordingCountdown || isPhotoCountingDown) && (
          <CountdownOverlay
              count={isRecordingCountdown ? recordingCountdownValue : photoCountdownRef.current}
              type={isRecordingCountdown ? 'video' : 'photo'}
          />
      )}
    </RecordingContext.Provider>
  );
};

export const RecordingSettings: React.FC = () => {
    const { config, setConfig, audioConfig, setAudioConfig, audioStream } = useRecordingContext();
    return (
        <MuiRecorderSettings
            config={config}
            setConfig={setConfig}
            audioConfig={audioConfig}
            setAudioConfig={setAudioConfig}
            audioStream={audioStream}
        />
    );
};