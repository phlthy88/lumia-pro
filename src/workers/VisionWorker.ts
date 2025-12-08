/// <reference lib="webworker" />
import { FilesetResolver, FaceLandmarker, FaceLandmarkerResult } from '@mediapipe/tasks-vision';

type InitMessage = { type: 'init'; wasmPath: string; modelAssetPath: string };
type FrameMessage = { type: 'frame'; image: ImageBitmap };
type DisposeMessage = { type: 'dispose' };
type IncomingMessage = InitMessage | FrameMessage | DisposeMessage;

type LandmarkEvent = { type: 'landmarks'; payload: { result: FaceLandmarkerResult | null; timestamp: number } };
type ReadyEvent = { type: 'ready' };
type ErrorEvent = { type: 'error'; message: string };
type OutgoingMessage = LandmarkEvent | ReadyEvent | ErrorEvent;

let landmarker: FaceLandmarker | null = null;
let offscreen: OffscreenCanvas | null = null;
let isProcessing = false;

const TARGET_WIDTH = 480;

async function ensureLandmarker(wasmPath: string, modelAssetPath: string) {
  if (landmarker) return;
  const vision = await FilesetResolver.forVisionTasks(wasmPath);
  landmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath,
      delegate: 'GPU'
    },
    runningMode: 'IMAGE',
    numFaces: 1
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
    if (!offscreen || offscreen.width !== TARGET_WIDTH) {
      const aspect = image.height > 0 ? image.width / image.height : 1;
      offscreen = new OffscreenCanvas(TARGET_WIDTH, Math.max(1, Math.round(TARGET_WIDTH / aspect)));
    }
    const ctx = offscreen.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('OffscreenCanvas 2D context unavailable');
    ctx.clearRect(0, 0, offscreen.width, offscreen.height);
    ctx.drawImage(image, 0, 0, offscreen.width, offscreen.height);
    const result = landmarker.detect(offscreen);
    postMessage({ type: 'landmarks', payload: { result, timestamp: performance.now() } } satisfies LandmarkEvent);
  } catch (err: any) {
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
        await ensureLandmarker(data.wasmPath, data.modelAssetPath);
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
      offscreen = null;
      isProcessing = false;
      close();
      break;
    default:
      break;
  }
};
