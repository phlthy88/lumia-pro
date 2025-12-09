import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

/**
 * Face landmark indices for mask regions
 * All indices are in sorted perimeter order for clean polygon rendering
 */
const REGIONS = {
  // Face oval - complete perimeter
  FACE_OVAL: [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
    397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
    172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10
  ],
  // Eye regions (closed loops)
  LEFT_EYE: [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7, 33],
  RIGHT_EYE: [362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382, 362],
  // Jawline contours for face slimming
  JAWLINE_LEFT: [234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152],
  JAWLINE_RIGHT: [454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152],
  // Cheekbone highlights
  LEFT_CHEEK: [116, 117, 118, 119, 100, 142, 203, 206, 216, 116],
  RIGHT_CHEEK: [345, 346, 347, 348, 329, 371, 423, 426, 436, 345],
  // Lip contour
  LIPS: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185, 61],
  // Nose bridge and tip
  NOSE: [168, 6, 197, 195, 5, 4, 1, 19, 94, 2, 98, 97, 326, 327, 168],
  // Forehead (for skin smoothing)
  FOREHEAD: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109],
} as const;

interface Point2D {
  x: number;
  y: number;
}

/**
 * MaskGenerator creates segmentation masks for beauty effects
 * 
 * Canvas 1 (RGB channels):
 * - R: Skin region (face oval minus eyes)
 * - G: Eye regions
 * - B: Face contour/jawline
 * 
 * Canvas 2 (RGB channels):
 * - R: Cheekbone regions
 * - G: Lip region
 * - B: Nose region
 */
export class MaskGenerator {
  private canvas: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D;
  private canvas2: OffscreenCanvas;
  private ctx2: OffscreenCanvasRenderingContext2D;
  
  // Temporal smoothing buffers
  private prevLandmarks: Point2D[] | null = null;
  private smoothingFactor = 0.3; // Lower = more smoothing
  
  // Performance: reuse path objects
  private readonly blurRadius = 12;

  constructor(width = 640, height = 480) {
    this.canvas = new OffscreenCanvas(width, height);
    const ctx = this.canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) throw new Error('MaskGenerator: 2D context unavailable');
    this.ctx = ctx;
    
    this.canvas2 = new OffscreenCanvas(width, height);
    const ctx2 = this.canvas2.getContext('2d', { willReadFrequently: false });
    if (!ctx2) throw new Error('MaskGenerator: 2D context unavailable');
    this.ctx2 = ctx2;
  }

  /**
   * Update masks with new landmarks
   * Applies temporal smoothing to reduce jitter
   */
  update(landmarks: NormalizedLandmark[] | undefined, videoWidth: number, videoHeight: number): void {
    if (!landmarks || landmarks.length < 468 || videoWidth === 0 || videoHeight === 0) {
      return;
    }

    // Resize canvases if needed
    if (this.canvas.width !== videoWidth || this.canvas.height !== videoHeight) {
      this.canvas.width = videoWidth;
      this.canvas.height = videoHeight;
      this.canvas2.width = videoWidth;
      this.canvas2.height = videoHeight;
      this.prevLandmarks = null; // Reset smoothing on resize
    }

    const w = this.canvas.width;
    const h = this.canvas.height;

    // Convert and smooth landmarks
    const points = this.processLandmarks(landmarks, w, h);

    // Clear canvases
    this.ctx.clearRect(0, 0, w, h);
    this.ctx2.clearRect(0, 0, w, h);

    // === Canvas 1: Skin, Eyes, Contour ===
    
    // Red channel: Skin (face oval minus eyes)
    this.ctx.fillStyle = '#ff0000';
    this.drawRegion(this.ctx, REGIONS.FACE_OVAL, points);
    
    // Cut out eyes from skin
    this.ctx.globalCompositeOperation = 'destination-out';
    this.drawRegion(this.ctx, REGIONS.LEFT_EYE, points);
    this.drawRegion(this.ctx, REGIONS.RIGHT_EYE, points);
    this.ctx.globalCompositeOperation = 'source-over';

    // Green channel: Eyes
    this.ctx.fillStyle = '#00ff00';
    this.drawRegion(this.ctx, REGIONS.LEFT_EYE, points);
    this.drawRegion(this.ctx, REGIONS.RIGHT_EYE, points);

    // Blue channel: Jawline contours (strokes for face slimming)
    this.ctx.strokeStyle = '#0000ff';
    this.ctx.lineWidth = Math.max(12, w * 0.015);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.drawStroke(this.ctx, REGIONS.JAWLINE_LEFT, points);
    this.drawStroke(this.ctx, REGIONS.JAWLINE_RIGHT, points);

    // === Canvas 2: Cheeks, Lips, Nose ===
    
    // Red channel: Cheekbones
    this.ctx2.fillStyle = '#ff0000';
    this.drawRegion(this.ctx2, REGIONS.LEFT_CHEEK, points);
    this.drawRegion(this.ctx2, REGIONS.RIGHT_CHEEK, points);

    // Green channel: Lips
    this.ctx2.fillStyle = '#00ff00';
    this.drawRegion(this.ctx2, REGIONS.LIPS, points);

    // Blue channel: Nose
    this.ctx2.fillStyle = '#0000ff';
    this.drawRegion(this.ctx2, REGIONS.NOSE, points);

    // Apply Gaussian blur for soft edges
    this.applyBlur(this.ctx, this.canvas);
    this.applyBlur(this.ctx2, this.canvas2);
  }

  /**
   * Convert normalized landmarks to canvas coordinates with temporal smoothing
   */
  private processLandmarks(landmarks: NormalizedLandmark[], w: number, h: number): Point2D[] {
    const points: Point2D[] = new Array(landmarks.length);
    
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i]!;
      let x = lm.x * w;
      let y = lm.y * h;
      
      // Apply temporal smoothing if we have previous frame
      if (this.prevLandmarks && this.prevLandmarks[i]) {
        const prev = this.prevLandmarks[i]!;
        x = prev.x + (x - prev.x) * this.smoothingFactor;
        y = prev.y + (y - prev.y) * this.smoothingFactor;
      }
      
      points[i] = { x, y };
    }
    
    // Store for next frame
    this.prevLandmarks = points;
    
    return points;
  }

  /**
   * Draw filled polygon region
   */
  private drawRegion(ctx: OffscreenCanvasRenderingContext2D, indices: readonly number[], points: Point2D[]): void {
    if (indices.length < 3) return;
    
    ctx.beginPath();
    const first = points[indices[0]!];
    if (!first) return;
    
    ctx.moveTo(first.x, first.y);
    
    for (let i = 1; i < indices.length; i++) {
      const p = points[indices[i]!];
      if (p) ctx.lineTo(p.x, p.y);
    }
    
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Draw stroke path (for contours)
   */
  private drawStroke(ctx: OffscreenCanvasRenderingContext2D, indices: readonly number[], points: Point2D[]): void {
    if (indices.length < 2) return;
    
    ctx.beginPath();
    const first = points[indices[0]!];
    if (!first) return;
    
    ctx.moveTo(first.x, first.y);
    
    for (let i = 1; i < indices.length; i++) {
      const p = points[indices[i]!];
      if (p) ctx.lineTo(p.x, p.y);
    }
    
    ctx.stroke();
  }

  /**
   * Apply Gaussian blur for soft mask edges
   */
  private applyBlur(ctx: OffscreenCanvasRenderingContext2D, canvas: OffscreenCanvas): void {
    ctx.filter = `blur(${this.blurRadius}px)`;
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';
  }

  /**
   * Set temporal smoothing factor (0-1, lower = more smoothing)
   */
  setSmoothingFactor(factor: number): void {
    this.smoothingFactor = Math.max(0.1, Math.min(1.0, factor));
  }

  /**
   * Reset temporal smoothing (call on face lost/found)
   */
  resetSmoothing(): void {
    this.prevLandmarks = null;
  }

  getCanvas(): OffscreenCanvas {
    return this.canvas;
  }

  getCanvas2(): OffscreenCanvas {
    return this.canvas2;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.prevLandmarks = null;
  }
}
