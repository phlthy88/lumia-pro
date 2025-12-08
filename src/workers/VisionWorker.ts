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

type LandmarkEvent = { type: 'landmarks'; payload: { result: any; timestamp: number } };
type ReadyEvent = { type: 'ready' };
type ErrorEvent = { type: 'error'; message: string };
type OutgoingMessage = LandmarkEvent | ReadyEvent | ErrorEvent;

let landmarker: FaceLandmarker | null = null;
let isProcessing = false;
let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 5;

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
  if (landmarker) return;
  
  try {
    const vision = await FilesetResolver.forVisionTasks(wasmPath);
    
    // Try GPU first, fallback to CPU if unavailable
    try {
      landmarker = await FaceLandmarker.createFromOptions(vision, {
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
      console.log('[VisionWorker] FaceLandmarker initialized with GPU delegate');
    } catch (gpuError) {
      console.warn('[VisionWorker] GPU delegate unavailable, falling back to CPU:', gpuError);
      
      // CPU fallback
      landmarker = await FaceLandmarker.createFromOptions(vision, {
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
      console.log('[VisionWorker] FaceLandmarker initialized with CPU delegate');
    }
    
    consecutiveErrors = 0;
    postMessage({ type: 'ready' } satisfies ReadyEvent);
  } catch (err: any) {
    console.error('[VisionWorker] FaceLandmarker initialization failed:', err);
    postMessage({ type: 'error', message: `Init failed: ${err?.message ?? 'Unknown error'}` } satisfies ErrorEvent);
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
function filterLandmarksByConfidence(landmarks: any[], minConfidence: number = 0.5) {
  if (!landmarks || !Array.isArray(landmarks)) return landmarks;
  
  return landmarks.map((face) => {
    if (!Array.isArray(face)) return face;
    
    // Filter out low-confidence points
    return face.filter((pt: any) => {
      // If no confidence field, assume valid
      if (!pt.hasOwnProperty('presence')) return true;
      return pt.presence >= minConfidence;
    });
  });
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
      const serializableResult = {
        faceLandmarks: filteredLandmarks.map((face) =>
          face.map((pt: { x: number; y: number; z: number }) => ({ x: pt.x, y: pt.y, z: pt.z }))
        ),
        faceBlendshapes: result.faceBlendshapes,
        facialTransformationMatrixes: result.facialTransformationMatrixes
      };
      
      console.log(`[VisionWorker] Detected ${result.faceLandmarks.length} face(s) at timestamp ${timestamp}`);
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
  } catch (err: any) {
    consecutiveErrors++;
    console.error(`[VisionWorker] Detection error (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`, err);
    
    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      postMessage({
        type: 'error',
        message: `Detection failed ${MAX_CONSECUTIVE_ERRORS} times: ${err?.message ?? 'Unknown error'}`
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
      } catch (err: any) {
        postMessage({
          type: 'error',
          message: err?.message ?? 'Vision worker init failed'
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
