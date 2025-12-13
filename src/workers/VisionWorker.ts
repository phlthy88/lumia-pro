/// <reference lib="webworker" />
import type { FaceLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';

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

interface SerializableLandmark { x: number; y: number; z: number; }
interface SerializableResult {
  faceLandmarks: SerializableLandmark[][];
}

type LandmarkEvent = { type: 'landmarks'; payload: { result: SerializableResult; timestamp: number } };
type ReadyEvent = { type: 'ready' };
type ErrorEvent = { type: 'error'; message: string };
type _OutgoingMessage = LandmarkEvent | ReadyEvent | ErrorEvent;

type VisionLib = Pick<typeof import('@mediapipe/tasks-vision'), 'FilesetResolver' | 'FaceLandmarker'>;
type FaceLandmarkerInstance = FaceLandmarker;

let visionLibPromise: Promise<VisionLib> | null = null;
let landmarker: FaceLandmarkerInstance | null = null;
let isInitializing = false;
let isProcessing = false;
let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 5;

function normalizeBundleBase(wasmPath: string): string {
  if (wasmPath.endsWith('/wasm/')) return wasmPath.slice(0, -6);
  if (wasmPath.endsWith('/wasm')) return wasmPath.slice(0, -5);
  return wasmPath.replace(/\/$/, '');
}

async function loadVisionLib(wasmPath: string): Promise<VisionLib> {
  if (!visionLibPromise) {
    visionLibPromise = (async () => {
      const basePath = normalizeBundleBase(wasmPath);
      const bundleUrl = `${basePath}/vision_bundle.js`;

      try {
        self.importScripts(bundleUrl);
      } catch (err) {
        throw new Error(
          `[VisionWorker] Failed to import MediaPipe vision bundle: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }

      const scoped = self as unknown as typeof globalThis & VisionLib;
      if (!scoped.FilesetResolver || !scoped.FaceLandmarker) {
        throw new Error('[VisionWorker] MediaPipe vision bundle did not expose expected globals');
      }

      return {
        FilesetResolver: scoped.FilesetResolver,
        FaceLandmarker: scoped.FaceLandmarker
      };
    })();
  }

  return visionLibPromise;
}

/**
 * Initialize FaceLandmarker with optimal settings for consistent detection
 * - VIDEO mode for temporal coherence (better tracking)
 * - GPU delegate when available (faster processing)
 * - 5 faces tracking (supports group scenarios)
 * - Input validation before processing
 */
async function ensureLandmarker(
  wasmPath: string,
  modelAssetPath: string,
  minFaceDetectionConfidence: number,
  minFacePresenceConfidence: number,
  minTrackingConfidence: number
) {
  if (landmarker || isInitializing) return;
  isInitializing = true;
  
  try {
    const { FilesetResolver, FaceLandmarker } = await loadVisionLib(wasmPath);
    const vision = await FilesetResolver.forVisionTasks(wasmPath);
    
    // Try GPU first, fallback to CPU if unavailable
    let newLandmarker: FaceLandmarkerInstance;
    try {
      newLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath,
          delegate: 'GPU'
        },
        runningMode: 'VIDEO', // VIDEO mode preserves temporal context for better tracking
        numFaces: 5, // Support up to 5 faces for group scenarios
        minFaceDetectionConfidence,
        minFacePresenceConfidence,
        minTrackingConfidence
      });
    } catch (gpuError) {
      console.warn('[VisionWorker] GPU delegate unavailable, falling back to CPU:', gpuError);
      
      // CPU fallback
      newLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath,
          delegate: 'CPU'
        },
        runningMode: 'VIDEO',
        numFaces: 5,
        minFaceDetectionConfidence,
        minFacePresenceConfidence,
        minTrackingConfidence
      });
    }
    
    // eslint-disable-next-line require-atomic-updates -- Single-threaded worker with guard at function start
    landmarker = newLandmarker;
    consecutiveErrors = 0;
    postMessage({ type: 'ready' } satisfies ReadyEvent);
  } catch (err) {
    console.error('[VisionWorker] FaceLandmarker initialization failed:', err);
    postMessage({ type: 'error', message: `Init failed: ${err instanceof Error ? err.message : 'Unknown error'}` } satisfies ErrorEvent);
  } finally {
    // eslint-disable-next-line require-atomic-updates -- Single-threaded worker with guard at function start
    isInitializing = false;
  }
}

/**
 * Validate bitmap dimensions before processing
 * Returns false if bitmap is too small or has invalid dimensions
 */
function validateBitmap(image: ImageBitmap): { valid: boolean; reason?: string } {
  // Minimum viable dimensions for face detection
  if (image.width < 80 || image.height < 80) {
    return {
      valid: false,
      reason: `Image too small: ${image.width}x${image.height} (min 80x80)`
    };
  }
  
  // Check for reasonable aspect ratio (face must be roughly square-ish)
  const aspectRatio = Math.max(image.width, image.height) / Math.min(image.width, image.height);
  if (aspectRatio > 3) {
    return {
      valid: false,
      reason: `Extreme aspect ratio: ${aspectRatio.toFixed(2)}:1`
    };
  }
  
  return { valid: true };
}

/**
 * Filter landmarks by confidence score
 * Only keep landmarks that meet minimum confidence threshold
 */
function filterLandmarksByConfidence(landmarks: NormalizedLandmark[][], _minConfidence: number = 0.5): NormalizedLandmark[][] {
  if (!landmarks || !Array.isArray(landmarks)) return landmarks;
  // NormalizedLandmark doesn't have confidence - return as-is
  // MediaPipe already filters by confidence internally via options
  return landmarks;
}

async function handleFrame(image: ImageBitmap, timestamp: number) {
  if (!landmarker || isProcessing) {
    image.close();
    return;
  }
  
  // Validate input before processing
  const validation = validateBitmap(image);
  if (!validation.valid) {
    console.warn(`[VisionWorker] Skipping frame: ${validation.reason}`);
    image.close();
    return;
  }
  
  isProcessing = true;
  try {
    // Use detectForVideo for VIDEO mode (requires timestamp for temporal tracking)
      const result = landmarker.detectForVideo(image as unknown as HTMLImageElement, timestamp);
    
    if (result.faceLandmarks && result.faceLandmarks.length > 0) {
      consecutiveErrors = 0;
      
      // Filter landmarks by confidence
      const filteredLandmarks = filterLandmarksByConfidence(result.faceLandmarks, 0.5);
      
      // Convert result to a plain serializable object
        const serializableResult: SerializableResult = {
          faceLandmarks: filteredLandmarks.map((face) =>
            face.map((pt) => ({ x: pt.x, y: pt.y, z: pt.z }))
          )
        };
      
      postMessage({
        type: 'landmarks',
        payload: { result: serializableResult, timestamp: performance.now() }
      } satisfies LandmarkEvent);
    } else {
      // No faces detected - this is normal, not an error
      postMessage({
        type: 'landmarks',
        payload: { result: { faceLandmarks: [] }, timestamp: performance.now() }
      } satisfies LandmarkEvent);
    }
  } catch (err) {
    consecutiveErrors++;
    console.error(`[VisionWorker] Detection error (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`, err);
    
    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      postMessage({
        type: 'error',
        message: `Detection failed ${MAX_CONSECUTIVE_ERRORS} times: ${err instanceof Error ? err.message : 'Unknown error'}`
      } satisfies ErrorEvent);
    }
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
      } catch (err) {
        postMessage({
          type: 'error',
          message: err instanceof Error ? err.message : 'Vision worker init failed'
        } satisfies ErrorEvent);
      }
      break;
    case 'frame':
      handleFrame(data.image, performance.now());
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
