import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

// Basic face skin polygon using jawline + forehead approximation
const SKIN_INDICES = [
  10, 234, 93, 132, 58, 172, 150, 176, 149, 148, 152, 377, 378, 365, 397, 288, 361, 323, 454, 356, 389, 251, 284, 332, 297, 338, 10
];

export class MaskGenerator {
  private canvas: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D;

  constructor(width = 512, height = 512) {
    this.canvas = new OffscreenCanvas(width, height);
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('MaskGenerator: 2D context unavailable');
    this.ctx = ctx;
  }

  update(landmarks: NormalizedLandmark[] | undefined, videoWidth: number, videoHeight: number) {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    if (!landmarks || videoWidth === 0 || videoHeight === 0) return;

    this.ctx.save();
    this.ctx.fillStyle = '#fff';

    const toCanvas = (lm: NormalizedLandmark) => ({
      x: lm.x * width,
      y: lm.y * height,
    });

    this.ctx.beginPath();
    SKIN_INDICES.forEach((idx, i) => {
      const lm = landmarks[idx];
      if (!lm) return;
      const { x, y } = toCanvas(lm);
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    });
    this.ctx.closePath();
    this.ctx.fill();

    // Feather edges to avoid hard mask
    this.ctx.filter = 'blur(8px)';
    this.ctx.globalCompositeOperation = 'source-in';
    this.ctx.drawImage(this.canvas, 0, 0);
    this.ctx.filter = 'none';
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.restore();
  }

  getCanvas() {
    return this.canvas;
  }
}
