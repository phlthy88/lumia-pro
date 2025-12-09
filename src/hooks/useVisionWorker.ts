import { useEffect, useMemo, useRef, useState } from 'react';
import { FilesetResolver, FaceLandmarker, type FaceLandmarkerResult } from '@mediapipe/tasks-vision';

type VisionState = {
  result: FaceLandmarkerResult | null;
  ready: boolean;
  error?: string;
};

const BASE_PATH = (import.meta.env.BASE_URL || '/').endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;
const DEFAULT_WASM = `${BASE_PATH}wasm`;
const DEFAULT_MODEL = `${BASE_PATH}models/face_landmarker.task`;

export const useVisionWorker = (
  videoRef: React.RefObject<HTMLVideoElement>,
  streamReady: boolean,
  enabled: boolean,
  options: {
    minFaceDetectionConfidence: number;
    minFacePresenceConfidence: number;
    minTrackingConfidence: number;
  }
) => {
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const [state, setState] = useState<VisionState>({ result: null, ready: false });

  // Initialize FaceLandmarker only when enabled
  useEffect(() => {
    if (!streamReady || !enabled || landmarkerRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(DEFAULT_WASM);
        if (cancelled) return;

        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: DEFAULT_MODEL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numFaces: 2,
          minFaceDetectionConfidence: options.minFaceDetectionConfidence,
          minFacePresenceConfidence: options.minFacePresenceConfidence,
          minTrackingConfidence: options.minTrackingConfidence
        });

        if (cancelled) {
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;
        console.log('[useVisionWorker] FaceLandmarker ready');
        setState(prev => ({ ...prev, ready: true }));
      } catch (err) {
        console.error('[useVisionWorker] Init failed:', err);
        setState(prev => ({ ...prev, error: err instanceof Error ? err.message : 'Init failed' }));
      }
    })();

    return () => {
      cancelled = true;
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
      setState({ result: null, ready: false });
    };
  }, [streamReady, enabled, options.minFaceDetectionConfidence, options.minFacePresenceConfidence, options.minTrackingConfidence]);

  // Cleanup when disabled or stream unavailable
  useEffect(() => {
    if ((!streamReady || !enabled) && landmarkerRef.current) {
      landmarkerRef.current.close();
      landmarkerRef.current = null;
      setState(prev => ({ ...prev, ready: false, result: null }));
    }
  }, [streamReady, enabled]);

  // Detection loop - RAF-based with frame rate limiting (no requestIdleCallback)
  useEffect(() => {
    if (!state.ready || !enabled) return;

    let rafId: number;
    let lastRun = 0;
    const TARGET_INTERVAL = 66; // ~15 FPS for face detection

    const detect = () => {
      const now = performance.now();
      
      // Rate limit to save CPU
      if (now - lastRun < TARGET_INTERVAL) {
        rafId = requestAnimationFrame(detect);
        return;
      }

      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      
      if (!video || !landmarker || video.readyState < 2 || video.paused) {
        rafId = requestAnimationFrame(detect);
        return;
      }

      try {
        const result = landmarker.detectForVideo(video, now);
        setState(prev => ({ ...prev, result }));
        lastRun = now;
      } catch {
        // Skip frame on error
      }

      rafId = requestAnimationFrame(detect);
    };

    rafId = requestAnimationFrame(detect);
    return () => cancelAnimationFrame(rafId);
  }, [state.ready, enabled, videoRef]);

  const hasFace = useMemo(() => (state.result?.faceLandmarks?.length ?? 0) > 0, [state.result]);

  return { landmarks: state.result, ready: state.ready, error: state.error, hasFace };
};
