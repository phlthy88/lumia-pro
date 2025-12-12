import { ImageSegmenter, FilesetResolver, ImageSegmenterResult } from '@mediapipe/tasks-vision';

/**
 * BackgroundBlur generates a segmentation mask for background blur effects
 * Uses MediaPipe Selfie Segmentation to create a person silhouette mask
 */
export class BackgroundBlur {
  private segmenter: ImageSegmenter | null = null;
  private runningMode: 'IMAGE' | 'VIDEO' = 'VIDEO';
  private lastVideoTime = -1;
  private isInitializing = false;
  private canvas: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D;

  constructor(width = 640, height = 480) {
    this.canvas = new OffscreenCanvas(width, height);
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('BackgroundBlur: 2D context unavailable');
    this.ctx = ctx as OffscreenCanvasRenderingContext2D;
  }

  async initialize() {
    if (this.segmenter || this.isInitializing) return;
    this.isInitializing = true;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
      );

      this.segmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite",
          delegate: "GPU"
        },
        runningMode: this.runningMode,
        outputCategoryMask: false,
        outputConfidenceMasks: true
      });
      console.log('[BackgroundBlur] Initialized with confidence masks');
    } catch (e) {
      console.error('[BackgroundBlur] Failed to initialize:', e);
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Generate segmentation mask from video frame
   * Returns a canvas where white = person, black = background
   */
  segment(video: HTMLVideoElement): OffscreenCanvas | null {
    if (!this.segmenter) {
      if (!this.isInitializing) this.initialize();
      return null;
    }

    if (video.currentTime === this.lastVideoTime) {
      return this.canvas;
    }
    this.lastVideoTime = video.currentTime;

    // Resize if needed
    if (this.canvas.width !== video.videoWidth || this.canvas.height !== video.videoHeight) {
      this.canvas.width = video.videoWidth;
      this.canvas.height = video.videoHeight;
    }

    const startTimeMs = performance.now();

    this.segmenter.segmentForVideo(video, startTimeMs, (result) => {
      this.processResult(result);
    });

    return this.canvas;
  }

  private processResult(result: ImageSegmenterResult) {
    const { width, height } = this.canvas;

    // Get confidence mask - selfie segmenter outputs one mask where higher = person
    const masks = result.confidenceMasks;
    if (!masks || masks.length === 0) return;

    const mask = masks[0];
    if (!mask) return;

    // Get as float array (values 0.0-1.0)
    const maskData = mask.getAsFloat32Array();

    const imageData = this.ctx.createImageData(width, height);
    const data = imageData.data;

    // Convert confidence to RGBA (Person=White, Bg=Black)
    // Higher confidence = more likely person
    for (let i = 0; i < maskData.length; i++) {
      const confidence = maskData[i] ?? 0;
      const val = Math.round(confidence * 255); // person confidence as brightness
      data[i * 4] = val;     // R
      data[i * 4 + 1] = val; // G
      data[i * 4 + 2] = val; // B
      data[i * 4 + 3] = 255; // A
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  getCanvas(): OffscreenCanvas {
    return this.canvas;
  }

  dispose() {
    this.segmenter?.close();
    this.segmenter = null;
  }
}
