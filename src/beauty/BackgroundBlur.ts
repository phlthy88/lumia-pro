import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

/**
 * BackgroundBlur generates a segmentation mask for background blur effects
 * Uses face landmarks to create a person silhouette mask
 * 
 * STATUS: Future feature - not yet integrated into the render pipeline
 * TODO: Integrate with GLRenderer when MediaPipe Selfie Segmentation is added
 * 
 * Future: Can be enhanced with MediaPipe Selfie Segmentation for better results
 */

// Extended body estimation from face landmarks
const SILHOUETTE_INDICES = {
  // Face boundary
  FACE: [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
    397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
    172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
  ],
  // Key points for body estimation
  CHIN: 152,
  LEFT_EAR: 234,
  RIGHT_EAR: 454,
  FOREHEAD: 10,
};

export interface BlurConfig {
  enabled: boolean;
  strength: number; // 0-1
  edgeFeather: number; // pixels
}

export class BackgroundBlur {
  private canvas: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D;
  private blurCanvas: OffscreenCanvas;
  private blurCtx: OffscreenCanvasRenderingContext2D;

  constructor(width = 640, height = 480) {
    this.canvas = new OffscreenCanvas(width, height);
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('BackgroundBlur: 2D context unavailable');
    this.ctx = ctx;

    this.blurCanvas = new OffscreenCanvas(width, height);
    const blurCtx = this.blurCanvas.getContext('2d');
    if (!blurCtx) throw new Error('BackgroundBlur: 2D context unavailable');
    this.blurCtx = blurCtx;
  }

  /**
   * Generate person silhouette mask from face landmarks
   * Returns a canvas where white = person, black = background
   */
  generateMask(
    landmarks: NormalizedLandmark[] | undefined,
    videoWidth: number,
    videoHeight: number
  ): OffscreenCanvas | null {
    if (!landmarks || landmarks.length < 468 || videoWidth === 0 || videoHeight === 0) {
      return null;
    }

    // Resize if needed
    if (this.canvas.width !== videoWidth || this.canvas.height !== videoHeight) {
      this.canvas.width = videoWidth;
      this.canvas.height = videoHeight;
      this.blurCanvas.width = videoWidth;
      this.blurCanvas.height = videoHeight;
    }

    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear
    this.ctx.clearRect(0, 0, w, h);
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, w, h);

    // Get key points
    const chin = landmarks[SILHOUETTE_INDICES.CHIN]!;
    const leftEar = landmarks[SILHOUETTE_INDICES.LEFT_EAR]!;
    const rightEar = landmarks[SILHOUETTE_INDICES.RIGHT_EAR]!;
    const forehead = landmarks[SILHOUETTE_INDICES.FOREHEAD]!;

    // Estimate body region based on face position
    const faceWidth = Math.abs(rightEar.x - leftEar.x) * w;
    const faceHeight = Math.abs(chin.y - forehead.y) * h;
    const faceCenterX = (leftEar.x + rightEar.x) / 2 * w;

    // Draw face oval
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    SILHOUETTE_INDICES.FACE.forEach((idx, i) => {
      const lm = landmarks[idx]!;
      const x = lm.x * w;
      const y = lm.y * h;
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    });
    this.ctx.closePath();
    this.ctx.fill();

    // Estimate shoulders/body (ellipse below face)
    const bodyWidth = faceWidth * 2.5;
    const bodyHeight = faceHeight * 3;
    const bodyY = chin.y * h + faceHeight * 0.3;

    this.ctx.beginPath();
    this.ctx.ellipse(
      faceCenterX,
      bodyY + bodyHeight / 2,
      bodyWidth / 2,
      bodyHeight / 2,
      0,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    // Connect face to body
    this.ctx.beginPath();
    this.ctx.moveTo(leftEar.x * w, chin.y * h);
    this.ctx.lineTo(faceCenterX - bodyWidth / 2, bodyY);
    this.ctx.lineTo(faceCenterX + bodyWidth / 2, bodyY);
    this.ctx.lineTo(rightEar.x * w, chin.y * h);
    this.ctx.closePath();
    this.ctx.fill();

    // Apply blur for soft edges
    this.ctx.filter = 'blur(20px)';
    this.blurCtx.clearRect(0, 0, w, h);
    this.blurCtx.drawImage(this.canvas, 0, 0);
    this.ctx.filter = 'none';

    // Threshold to clean up edges
    this.ctx.clearRect(0, 0, w, h);
    this.ctx.drawImage(this.blurCanvas, 0, 0);

    return this.canvas;
  }

  /**
   * Apply background blur to video frame
   * Returns composited result with blurred background
   */
  applyBlur(
    video: HTMLVideoElement,
    mask: OffscreenCanvas,
    config: BlurConfig
  ): OffscreenCanvas {
    const w = this.blurCanvas.width;
    const h = this.blurCanvas.height;

    // Draw blurred background
    this.blurCtx.filter = `blur(${config.strength * 20}px)`;
    this.blurCtx.drawImage(video, 0, 0, w, h);
    this.blurCtx.filter = 'none';

    // Use mask to composite
    this.blurCtx.globalCompositeOperation = 'destination-in';
    this.blurCtx.drawImage(mask, 0, 0);
    this.blurCtx.globalCompositeOperation = 'source-over';

    // Draw sharp foreground
    this.ctx.clearRect(0, 0, w, h);
    this.ctx.drawImage(video, 0, 0, w, h);
    
    // Mask out background from foreground
    this.ctx.globalCompositeOperation = 'destination-in';
    // Invert mask for foreground
    this.ctx.filter = 'invert(1)';
    this.ctx.drawImage(mask, 0, 0);
    this.ctx.filter = 'none';
    this.ctx.globalCompositeOperation = 'source-over';

    // Composite: blurred bg + sharp fg
    this.blurCtx.drawImage(this.canvas, 0, 0);

    return this.blurCanvas;
  }

  getCanvas(): OffscreenCanvas {
    return this.canvas;
  }

  dispose(): void {
    // Clear canvas contexts to release memory
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.blurCtx.clearRect(0, 0, this.blurCanvas.width, this.blurCanvas.height);
    // Resize to 1x1 to free GPU memory
    this.canvas.width = 1;
    this.canvas.height = 1;
    this.blurCanvas.width = 1;
    this.blurCanvas.height = 1;
  }
}
