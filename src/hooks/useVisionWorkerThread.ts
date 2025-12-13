import { useRef, useEffect, useState } from 'react';

interface SerializableLandmark { x: number; y: number; z: number; }
interface SerializableResult {
  faceLandmarks: SerializableLandmark[][];
}

interface VisionWorkerState {
  result: SerializableResult | null;
  ready: boolean;
  error?: string;
}

export const useVisionWorkerThread = (
  videoRef: React.RefObject<HTMLVideoElement>,
  streamReady: boolean,
  enabled: boolean,
  options: {
    minFaceDetectionConfidence: number;
    minFacePresenceConfidence: number;
    minTrackingConfidence: number;
  }
) => {
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<VisionWorkerState>({ result: null, ready: false });
  const lastUpdateRef = useRef<number>(0);

  // Initialize worker
  useEffect(() => {
    if (!streamReady || !enabled || workerRef.current) return;

    const worker = new Worker(new URL('../workers/VisionWorker.ts', import.meta.url), {
      type: 'classic',
      name: 'vision-worker'
    });

    worker.onmessage = (event) => {
      const { type, payload } = event.data || {};
      
      switch (type) {
        case 'landmarks':
          const now = performance.now();
          if (now - lastUpdateRef.current > 1000) {
            setState(prev => ({ ...prev, result: payload?.result }));
            lastUpdateRef.current = now;
          }
          break;
        case 'ready':
          setState(prev => ({ ...prev, ready: true }));
          break;
        case 'error':
          setState(prev => ({ ...prev, error: payload?.message || 'Unknown error' }));
          break;
      }
    };

    // Initialize the worker
    worker.postMessage({
      type: 'init',
      wasmPath: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm`,
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task`,
      minFaceDetectionConfidence: options.minFaceDetectionConfidence,
      minFacePresenceConfidence: options.minFacePresenceConfidence,
      minTrackingConfidence: options.minTrackingConfidence
    });

    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
      setState({ result: null, ready: false });
    };
  }, [streamReady, enabled, options.minFaceDetectionConfidence, options.minFacePresenceConfidence, options.minTrackingConfidence]);

  // Post frames to worker
  useEffect(() => {
    if (!state.ready || !enabled || !workerRef.current) return;

    let isProcessing = false;
    let rafId: number;

    const postFrame = () => {
      if (isProcessing) {
        rafId = requestAnimationFrame(postFrame);
        return;
      }

      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        rafId = requestAnimationFrame(postFrame);
        return;
      }

      // Only post frames every ~1 second to avoid overwhelming the worker
      const now = performance.now();
      if (now - lastUpdateRef.current < 1000) {
        rafId = requestAnimationFrame(postFrame);
        return;
      }

      isProcessing = true;
      
      // Create ImageBitmap from video frame (non-blocking)
      createImageBitmap(video).then(bitmap => {
        workerRef.current!.postMessage({ type: 'frame', image: bitmap }, [bitmap]);
        isProcessing = false;
        rafId = requestAnimationFrame(postFrame);
      }).catch(() => {
        isProcessing = false;
        rafId = requestAnimationFrame(postFrame);
      });
    };

    rafId = requestAnimationFrame(postFrame);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [state.ready, enabled, videoRef]);

  const hasFace = (state.result?.faceLandmarks ?? []).length > 0;

  return {
    landmarks: state.result,
    ready: state.ready,
    error: state.error,
    hasFace
  };
};

export default useVisionWorkerThread;
