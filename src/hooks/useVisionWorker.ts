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

  // Initialize FaceLandmarker
  useEffect(() => {
    if (!streamReady || !enabled || landmarkerRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(`${BASE_PATH}wasm`);
        if (cancelled) return;

        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: `${BASE_PATH}models/face_landmarker.task`, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numFaces: 1, // Reduce to 1 face for performance
          minFaceDetectionConfidence: options.minFaceDetectionConfidence,
          minFacePresenceConfidence: options.minFacePresenceConfidence,
          minTrackingConfidence: options.minTrackingConfidence
        });

        if (cancelled) {
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;
        setState(prev => ({ ...prev, ready: true }));
      } catch (err) {
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

  // Detection using requestIdleCallback for better performance
  useEffect(() => {
    if (!state.ready || !enabled) return;

    let isProcessing = false;
    let timeoutId: number;

    const detect = () => {
      if (isProcessing) {
        timeoutId = window.setTimeout(detect, 300);
        return;
      }

      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      
      if (!video || !landmarker || video.readyState < 2) {
        timeoutId = window.setTimeout(detect, 300);
        return;
      }

      // Use requestIdleCallback if available, otherwise setTimeout
      const processFrame = () => {
        if (isProcessing) return;
        
        isProcessing = true;
        try {
          const result = landmarker.detectForVideo(video, performance.now());
          setState(prev => ({ ...prev, result }));
        } catch (e) {
          // Silently drop frames on error
        } finally {
          isProcessing = false;
          timeoutId = window.setTimeout(detect, 500); // ~2fps to lower message load
        }
      };

      if ('requestIdleCallback' in window) {
        requestIdleCallback(processFrame, { timeout: 100 });
      } else {
        setTimeout(processFrame, 0);
      }
    };

    detect();

    return () => clearTimeout(timeoutId);
  }, [state.ready, enabled, videoRef]);

  const hasFace = useMemo(() => (state.result?.faceLandmarks?.length ?? 0) > 0, [state.result]);

  return { landmarks: state.result, ready: state.ready, error: state.error, hasFace };
};
