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
  options: {
    minFaceDetectionConfidence: number;
    minFacePresenceConfidence: number;
    minTrackingConfidence: number;
  }
) => {
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const intervalRef = useRef<number>(0);
  const [state, setState] = useState<VisionState>({ result: null, ready: false });

  // Initialize FaceLandmarker
  // Initialize FaceLandmarker when stream is ready
  useEffect(() => {
    if (!streamReady || landmarkerRef.current) return;

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
      } catch (err: any) {
        console.error('[useVisionWorker] Init failed:', err);
        setState(prev => ({ ...prev, error: err?.message || 'Init failed' }));
      }
    })();

    return () => {
      cancelled = true;
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, [streamReady, options.minFaceDetectionConfidence, options.minFacePresenceConfidence, options.minTrackingConfidence]);

  // Cleanup when stream becomes unavailable
  useEffect(() => {
    if (!streamReady && landmarkerRef.current) {
      landmarkerRef.current.close();
      landmarkerRef.current = null;
      setState(prev => ({ ...prev, ready: false, result: null }));
    }
  }, [streamReady]);

  // Detection loop - 100ms interval (~10fps) to avoid blocking rendering
  useEffect(() => {
    if (!state.ready) return;

    const detect = () => {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !landmarker || video.readyState < 2) return;

      // Use idle callback if available, otherwise run directly
      const run = () => {
        try {
          const result = landmarker.detectForVideo(video, performance.now());
          setState(prev => ({ ...prev, result }));
        } catch {
          // Skip frame
        }
      };

      if ('requestIdleCallback' in window) {
        requestIdleCallback(run, { timeout: 50 });
      } else {
        run();
      }
    };

    intervalRef.current = window.setInterval(detect, 100);
    return () => clearInterval(intervalRef.current);
  }, [state.ready, videoRef]);

  const hasFace = useMemo(() => (state.result?.faceLandmarks?.length ?? 0) > 0, [state.result]);

  return { landmarks: state.result, ready: state.ready, error: state.error, hasFace };
};
