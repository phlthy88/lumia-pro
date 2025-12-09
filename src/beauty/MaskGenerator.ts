import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

// Face oval - sorted perimeter order for clean polygon
const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
  397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
  172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10
];

// Eye region indices (left and right)
const LEFT_EYE = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7, 33];
const RIGHT_EYE = [362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382, 362];

// Face contour for slim effect (sides only - jawline)
const FACE_CONTOUR_LEFT = [234, 93, 132, 58, 172, 136];
const FACE_CONTOUR_RIGHT = [454, 323, 361, 288, 397, 365];

// Cheekbone regions
const LEFT_CHEEK = [116, 117, 118, 119, 100, 142, 203, 206, 216, 116];
const RIGHT_CHEEK = [345, 346, 347, 348, 329, 371, 423, 426, 436, 345];

// Lip region - outer contour sorted
const LIPS_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185, 61];

// Nose region
const NOSE = [168, 6, 197, 195, 5, 4, 1, 19, 94, 2, 98, 97, 326, 327, 168];

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
    if (!landmarks || videoWidth === 0 || videoHeight === 0) return;

    // Resize canvas to match video for accurate mapping
    if (this.canvas.width !== videoWidth || this.canvas.height !== videoHeight) {
      this.canvas.width = videoWidth;
      this.canvas.height = videoHeight;
      this.canvas2.width = videoWidth;
      this.canvas2.height = videoHeight;
    }

    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Clear previous frame
    this.ctx.clearRect(0, 0, width, height);
    this.ctx2.clearRect(0, 0, width, height);

    const toCanvas = (lm: NormalizedLandmark) => ({ x: lm.x * width, y: lm.y * height });

    // Canvas 1: R=skin (excluding eyes), G=eyes, B=face contour
    
    // Draw face oval for skin
    this.ctx.fillStyle = '#ff0000';
    this.drawPoly(this.ctx, FACE_OVAL, landmarks, toCanvas);
    
    // Cut out eye regions from skin
    this.ctx.globalCompositeOperation = 'destination-out';
    this.drawPoly(this.ctx, LEFT_EYE, landmarks, toCanvas);
    this.drawPoly(this.ctx, RIGHT_EYE, landmarks, toCanvas);
    this.ctx.globalCompositeOperation = 'source-over';

    // Draw eyes in green channel
    this.ctx.fillStyle = '#00ff00';
    this.drawPoly(this.ctx, LEFT_EYE, landmarks, toCanvas);
    this.drawPoly(this.ctx, RIGHT_EYE, landmarks, toCanvas);

    // Draw face contour as strokes on sides only
    this.ctx.strokeStyle = '#0000ff';
    this.ctx.lineWidth = Math.max(15, width * 0.02);
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
    this.applyBlur(this.ctx, this.canvas);
    this.applyBlur(this.ctx2, this.canvas2);
  }

  private applyBlur(ctx: OffscreenCanvasRenderingContext2D, canvas: OffscreenCanvas) {
    ctx.filter = 'blur(8px)';
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';
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
