import { useState, useCallback, useRef, useEffect } from 'react';

interface MediaItem {
  id: string;
  type: 'video' | 'photo';
  blob: Blob;
  timestamp: number;
  duration?: number;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  mediaItems: MediaItem[];
}

export const useRecording = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    mediaItems: []
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const startTimeRef = useRef<number>(0);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    if (!canvasRef.current) return;

    try {
      const stream = canvasRef.current.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const mediaItem: MediaItem = {
          id: `video_${Date.now()}`,
          type: 'video',
          blob,
          timestamp: Date.now(),
          duration: state.duration
        };

        setState(prev => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          duration: 0,
          mediaItems: [mediaItem, ...prev.mediaItems]
        }));
      };

      mediaRecorder.start(1000);
      setState(prev => ({ ...prev, isRecording: true }));
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [canvasRef, state.duration]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [state.isRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && !state.isPaused) {
      mediaRecorderRef.current.pause();
      setState(prev => ({ ...prev, isPaused: true }));
    }
  }, [state.isRecording, state.isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && state.isPaused) {
      mediaRecorderRef.current.resume();
      setState(prev => ({ ...prev, isPaused: false }));
    }
  }, [state.isRecording, state.isPaused]);

  const takeSnapshot = useCallback(async (): Promise<Blob | null> => {
    if (!canvasRef.current) return null;

    return new Promise((resolve) => {
      canvasRef.current!.toBlob((blob) => {
        if (blob) {
          const mediaItem: MediaItem = {
            id: `photo_${Date.now()}`,
            type: 'photo',
            blob,
            timestamp: Date.now()
          };

          setState(prev => ({
            ...prev,
            mediaItems: [mediaItem, ...prev.mediaItems]
          }));
        }
        resolve(blob);
      }, 'image/png');
    });
  }, [canvasRef]);

  const deleteMedia = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      mediaItems: prev.mediaItems.filter(item => item.id !== id)
    }));
  }, []);

  const loadItemUrl = useCallback((item: MediaItem): string => {
    return URL.createObjectURL(item.blob);
  }, []);

  // Update duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (state.isRecording && !state.isPaused) {
      interval = setInterval(() => {
        setState(prev => ({
          ...prev,
          duration: Math.floor((Date.now() - startTimeRef.current) / 1000)
        }));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isRecording, state.isPaused]);

  return {
    isRecording: state.isRecording,
    isPaused: state.isPaused,
    duration: state.duration,
    mediaItems: state.mediaItems,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    takeSnapshot,
    deleteMedia,
    loadItemUrl
  };
};
