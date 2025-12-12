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
        outputCategoryMask: true,
        outputConfidenceMasks: false
      });
      console.log('BackgroundBlur initialized');
    } catch (e) {
      console.error('Failed to initialize BackgroundBlur:', e);
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

    // In VIDEO mode, we need to pass timestamp
    this.segmenter.segmentForVideo(video, startTimeMs, (result) => {
        this.processResult(result);
    });

    return this.canvas;
  }

  private processResult(result: ImageSegmenterResult) {
      const { width, height } = this.canvas;

      // Get category mask (Uint8Array/Float32Array depending on config)
      // For selfie segmenter: 0 = background, 1 = person
      // But result.categoryMask might be an ImageBitmap or something else depending on outputCategoryMask
      // Tasks-vision 0.10.8 returns `categoryMask` as `MPMask`.

      const mask = result.categoryMask;
      if (!mask) return;

      // We need to draw the mask to our canvas.
      // If mask is an ImageBitmap or WebGLTexture, we can draw it.
      // The MediaPipe JS API usually provides `getAsFloat32Array()` or `getAsUint8Array()`.

      // Optimally, we want to upload this directly to GPU, but here we prepare an OffscreenCanvas
      // that GLRenderer can upload.

      // Check if we can just draw it (if it's an ImageBitmap compatible object)
      // Actually, MPImage in JS usually has `getAs...` methods.
      // Let's assume we need to convert the data to ImageData.

      const maskData = mask.getAsUint8Array();
      // This is a single channel array of category indices.

      const imageData = this.ctx.createImageData(width, height);
      const data = imageData.data;

      // Convert category index to RGBA (Person=White, Bg=Black)
      for (let i = 0; i < maskData.length; i++) {
          const category = maskData[i];
          const val = category === 1 ? 255 : 0; // 1 is person
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
