/// <reference lib="webworker" />
import { FilesetResolver, FaceLandmarker, FaceLandmarkerResult } from '@mediapipe/tasks-vision';

type InitMessage = {
  type: 'init';
  wasmPath: string;
  modelAssetPath: string;
  minFaceDetectionConfidence: number;
  minFacePresenceConfidence: number;
  minTrackingConfidence: number;
};
type FrameMessage = { type: 'frame'; image: ImageBitmap };
type DisposeMessage = { type: 'dispose' };
type IncomingMessage = InitMessage | FrameMessage | DisposeMessage;

type LandmarkEvent = { type: 'landmarks'; payload: { result: FaceLandmarkerResult | null; timestamp: number } };
type ReadyEvent = { type: 'ready' };
type ErrorEvent = { type: 'error'; message: string };
type OutgoingMessage = LandmarkEvent | ReadyEvent | ErrorEvent;

let landmarker: FaceLandmarker | null = null;
let isProcessing = false;

async function ensureLandmarker(
  wasmPath: string,
  modelAssetPath: string,
  minFaceDetectionConfidence: number,
  minFacePresenceConfidence: number,
  minTrackingConfidence: number
) {
  if (landmarker) return;
  const vision = await FilesetResolver.forVisionTasks(wasmPath);
  landmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath,
      delegate: 'CPU'
    },
    runningMode: 'IMAGE',
    numFaces: 1,
    minFaceDetectionConfidence,
    minFacePresenceConfidence,
    minTrackingConfidence
  });
  postMessage({ type: 'ready' } satisfies ReadyEvent);
}

async function handleFrame(image: ImageBitmap) {
  if (!landmarker || isProcessing) {
    image.close();
    return;
  }
  isProcessing = true;
  try {
    const result = landmarker.detect(image as unknown as HTMLImageElement);
    console.log('[VisionWorker] Detected faces:', result.faceLandmarks?.length ?? 0);
    postMessage({ type: 'landmarks', payload: { result, timestamp: performance.now() } } satisfies LandmarkEvent);
  } catch (err: any) {
    console.error('[VisionWorker] Detection error:', err);
    postMessage({ type: 'error', message: err?.message ?? 'Vision worker frame failed' } satisfies ErrorEvent);
  } finally {
    image.close();
    isProcessing = false;
  }
}

self.onmessage = async (event: MessageEvent<IncomingMessage>) => {
  const data = event.data;
  switch (data.type) {
    case 'init':
      try {
        await ensureLandmarker(
          data.wasmPath,
          data.modelAssetPath,
          data.minFaceDetectionConfidence,
          data.minFacePresenceConfidence,
          data.minTrackingConfidence
        );
      } catch (err: any) {
        postMessage({ type: 'error', message: err?.message ?? 'Vision worker init failed' } satisfies ErrorEvent);
      }
      break;
    case 'frame':
      handleFrame(data.image);
      break;
    case 'dispose':
      landmarker?.close();
      landmarker = null;
      isProcessing = false;
      close();
      break;
    default:
      break;
  }
};
