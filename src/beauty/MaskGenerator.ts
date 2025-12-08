import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

// Face skin polygon using jawline + forehead
const SKIN_INDICES = [
  10, 234, 93, 132, 58, 172, 150, 176, 149, 148, 152, 377, 378, 365, 397, 288, 361, 323, 454, 356, 389, 251, 284, 332, 297, 338, 10
];

// Eye region indices (left and right)
const LEFT_EYE = [33, 133, 160, 159, 158, 144, 145, 153];
const RIGHT_EYE = [362, 263, 387, 386, 385, 373, 374, 380];

// Face contour for slim effect (sides only - jawline)
const FACE_CONTOUR_LEFT = [234, 93, 132, 58, 172, 136];
const FACE_CONTOUR_RIGHT = [454, 323, 361, 288, 397, 365];

// Cheekbone regions
const LEFT_CHEEK = [116, 117, 118, 119, 100, 126, 209, 49, 129, 203];
const RIGHT_CHEEK = [345, 346, 347, 348, 329, 355, 429, 279, 358, 423];

// Lip region
const LIPS_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185, 61];

// Nose region
const NOSE = [168, 6, 197, 195, 5, 4, 1, 19, 94, 2, 164, 0, 11, 12, 13, 14, 168];

export class MaskGenerator {
  private canvas: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D;
  private canvas2: OffscreenCanvas;
  private ctx2: OffscreenCanvasRenderingContext2D;

  constructor(width = 512, height = 512) {
    this.canvas = new OffscreenCanvas(width, height);
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('MaskGenerator: 2D context unavailable');
    this.ctx = ctx;
    
    this.canvas2 = new OffscreenCanvas(width, height);
    const ctx2 = this.canvas2.getContext('2d');
    if (!ctx2) throw new Error('MaskGenerator: 2D context unavailable');
    this.ctx2 = ctx2;
  }

  update(landmarks: NormalizedLandmark[] | undefined, videoWidth: number, videoHeight: number) {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    this.ctx2.clearRect(0, 0, width, height);
    if (!landmarks || videoWidth === 0 || videoHeight === 0) return;

    const toCanvas = (lm: NormalizedLandmark) => ({ x: lm.x * width, y: lm.y * height });

    // Canvas 1: R=skin, G=eyes, B=face contour (sides only)
    this.ctx.fillStyle = '#ff0000';
    this.drawPoly(this.ctx, SKIN_INDICES, landmarks, toCanvas);

    this.ctx.fillStyle = '#00ff00';
    this.drawPoly(this.ctx, LEFT_EYE, landmarks, toCanvas);
    this.drawPoly(this.ctx, RIGHT_EYE, landmarks, toCanvas);

    // Draw face contour as strokes on sides only (not chin)
    this.ctx.strokeStyle = '#0000ff';
    this.ctx.lineWidth = 20;
    this.ctx.lineCap = 'round';
    for (const contour of [FACE_CONTOUR_LEFT, FACE_CONTOUR_RIGHT]) {
      this.ctx.beginPath();
      contour.forEach((idx, i) => {
        const lm = landmarks[idx];
        if (!lm) return;
        const { x, y } = toCanvas(lm);
        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      });
      this.ctx.stroke();
    }

    // Canvas 2: R=cheeks, G=lips, B=nose
    this.ctx2.fillStyle = '#ff0000';
    this.drawPoly(this.ctx2, LEFT_CHEEK, landmarks, toCanvas);
    this.drawPoly(this.ctx2, RIGHT_CHEEK, landmarks, toCanvas);

    this.ctx2.fillStyle = '#00ff00';
    this.drawPoly(this.ctx2, LIPS_OUTER, landmarks, toCanvas);

    this.ctx2.fillStyle = '#0000ff';
    this.drawPoly(this.ctx2, NOSE, landmarks, toCanvas);

    // Apply blur for soft edges
    for (const c of [this.ctx, this.ctx2]) {
      c.filter = 'blur(8px)';
      c.globalCompositeOperation = 'source-atop';
      c.drawImage(c === this.ctx ? this.canvas : this.canvas2, 0, 0);
      c.filter = 'none';
      c.globalCompositeOperation = 'source-over';
    }
  }

  private drawPoly(ctx: OffscreenCanvasRenderingContext2D, indices: number[], landmarks: NormalizedLandmark[], toCanvas: (lm: NormalizedLandmark) => {x: number, y: number}) {
    ctx.beginPath();
    indices.forEach((idx, i) => {
      const lm = landmarks[idx];
      if (!lm) return;
      const { x, y } = toCanvas(lm);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
  }

  getCanvas() {
    return this.canvas;
  }

  getCanvas2() {
    return this.canvas2;
  }
}
