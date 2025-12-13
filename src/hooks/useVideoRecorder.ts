import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * @fileoverview Hook for recording video from a canvas with optional audio,
 * handling codec negotiation and providing a Promise-based API.
 */

export interface UseVideoRecorderOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  audioStream?: MediaStream | null;
  config?: {
    mimeType?: string;
    videoBitrate?: number;
    audioBitrate?: number;
  };
  onError?: (error: Error) => void;
}

export interface UseVideoRecorderReturn {
  isRecording: boolean;
  duration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
}

export const useVideoRecorder = (options: UseVideoRecorderOptions): UseVideoRecorderReturn => {
  const { canvasRef, audioStream, config, onError } = options;
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartRef = useRef<number>(0);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        resolve(null);
        return;
      }
      
      let chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType });
        setIsRecording(false);
        setDuration(0);
        if (timerRef.current) clearInterval(timerRef.current);
        resolve(blob);
      };

      recorder.onerror = (event) => {
        onError?.(event.error);
        setIsRecording(false);
        setDuration(0);
        if (timerRef.current) clearInterval(timerRef.current);
        resolve(null);
      };

      recorder.stop();
    });
  }, [onError]);

  const startRecording = useCallback(async () => {
    if (!canvasRef.current) {
      onError?.(new Error('Canvas ref is not available'));
      return;
    }
    if (isRecording) await stopRecording();
    
    const stream = canvasRef.current.captureStream(30);
    if (audioStream) {
      audioStream.getAudioTracks().forEach(track => stream.addTrack(track));
    }
    
    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          onError?.(new Error("No supported MIME type found for MediaRecorder."));
          return;
        }
      }
    }

    const recorder = new MediaRecorder(stream, {
        mimeType: config?.mimeType || mimeType,
        videoBitsPerSecond: config?.videoBitrate || 2500000,
        audioBitsPerSecond: config?.audioBitrate || 128000,
    });
    
    mediaRecorderRef.current = recorder;
    recordingStartRef.current = Date.now();
    
    recorder.start();
    setIsRecording(true);

    timerRef.current = setInterval(() => {
        setDuration((Date.now() - recordingStartRef.current) / 1000);
    }, 100);

  }, [canvasRef, audioStream, config, onError, isRecording, stopRecording]);
  
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return { isRecording, duration, startRecording, stopRecording };
};