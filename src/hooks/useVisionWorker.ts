import { useEffect, useMemo, useRef, useState } from 'react';
import type { FaceLandmarkerResult } from '@mediapipe/tasks-vision';

type VisionState = {
  result: FaceLandmarkerResult | null;
  ready: boolean;
  error?: string;
};

const DEFAULT_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm';
const DEFAULT_MODEL = '/models/face_landmarker.task';

export const useVisionWorker = (
  videoRef: React.RefObject<HTMLVideoElement>,
  streamReady: boolean,
  options: {
    minFaceDetectionConfidence: number;
    minFacePresenceConfidence: number;
    minTrackingConfidence: number;
  }
) => {
  const workerRef = useRef<Worker | null>(null);
  const intervalRef = useRef<number>();
  const sendingRef = useRef(false);

  const [state, setState] = useState<VisionState>({ result: null, ready: false });

  // Instantiate worker when stream ready
  useEffect(() => {
    if (!streamReady || workerRef.current) return;
    const worker = new Worker(new URL('../workers/VisionWorker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<any>) => {
      const { type, payload, message } = event.data || {};
      if (type === 'ready') {
        setState((prev) => ({ ...prev, ready: true, error: undefined }));
      } else if (type === 'landmarks') {
        setState((prev) => ({ ...prev, result: payload?.result ?? null }));
        sendingRef.current = false;
      } else if (type === 'error') {
        setState((prev) => ({ ...prev, error: message || 'Vision worker error' }));
        sendingRef.current = false;
      }
    };

    worker.postMessage({
      type: 'init',
      wasmPath: DEFAULT_WASM,
      modelAssetPath: DEFAULT_MODEL,
      ...options
    });

    return () => {
      worker.postMessage({ type: 'dispose' });
      workerRef.current = null;
    };
  }, [streamReady, options]);

  // Frame pump - only run when worker is ready
  useEffect(() => {
    if (!streamReady || !state.ready) return;
    intervalRef.current = window.setInterval(async () => {
      if (sendingRef.current) return;
      const video = videoRef.current;
      if (!video || video.readyState < 2 || !workerRef.current) return;
      try {
        sendingRef.current = true;
        const bitmap = await createImageBitmap(video);
        workerRef.current.postMessage({ type: 'frame', image: bitmap }, [bitmap]);
      } catch (err) {
        sendingRef.current = false;
      }
    }, 50); // ~20fps detection cadence

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      sendingRef.current = false;
    };
  }, [streamReady, state.ready, videoRef]);

  const hasFace = useMemo(() => (state.result?.faceLandmarks?.length ?? 0) > 0, [state.result]);

  return {
    landmarks: state.result,
    ready: state.ready,
    error: state.error,
    hasFace
  };
};
