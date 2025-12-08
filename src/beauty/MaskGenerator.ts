import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

// Face skin polygon using jawline + forehead
const SKIN_INDICES = [
  10, 234, 93, 132, 58, 172, 150, 176, 149, 148, 152, 377, 378, 365, 397, 288, 361, 323, 454, 356, 389, 251, 284, 332, 297, 338, 10
];

// Eye region indices (left and right)
const LEFT_EYE = [33, 133, 160, 159, 158, 144, 145, 153];
const RIGHT_EYE = [362, 263, 387, 386, 385, 373, 374, 380];

// Face contour for slim effect
const FACE_CONTOUR = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10];

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

    const toCanvas = (lm: NormalizedLandmark) => ({ x: lm.x * width, y: lm.y * height });

    // R channel: Skin mask
    this.ctx.fillStyle = '#ff0000';
    this.drawPoly(SKIN_INDICES, landmarks, toCanvas);

    // G channel: Eye regions
    this.ctx.fillStyle = '#00ff00';
    this.drawPoly(LEFT_EYE, landmarks, toCanvas);
    this.drawPoly(RIGHT_EYE, landmarks, toCanvas);

    // B channel: Face contour (for slim effect - draw as stroke)
    this.ctx.strokeStyle = '#0000ff';
    this.ctx.lineWidth = 20;
    this.ctx.beginPath();
    FACE_CONTOUR.forEach((idx, i) => {
      const lm = landmarks[idx];
      if (!lm) return;
      const { x, y } = toCanvas(lm);
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    });
    this.ctx.stroke();

    // Apply blur for soft edges
    this.ctx.filter = 'blur(6px)';
    this.ctx.globalCompositeOperation = 'source-atop';
    this.ctx.drawImage(this.canvas, 0, 0);
    this.ctx.filter = 'none';
    this.ctx.globalCompositeOperation = 'source-over';
  }

  private drawPoly(indices: number[], landmarks: NormalizedLandmark[], toCanvas: (lm: NormalizedLandmark) => {x: number, y: number}) {
    this.ctx.beginPath();
    indices.forEach((idx, i) => {
      const lm = landmarks[idx];
      if (!lm) return;
      const { x, y } = toCanvas(lm);
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    });
    this.ctx.closePath();
    this.ctx.fill();
  }

  getCanvas() {
    return this.canvas;
  }
}
