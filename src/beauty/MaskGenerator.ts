import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

// Face skin polygon using jawline + forehead
const SKIN_INDICES = [
  10, 234, 93, 132, 58, 172, 150, 176, 149, 148, 152, 377, 378, 365, 397, 288, 361, 323, 454, 356, 389, 251, 284, 332, 297, 338, 10
];

// Eye region indices (left and right) - expanded for better coverage
const LEFT_EYE = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7];
const RIGHT_EYE = [362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382];

// Face contour for slim effect (sides only - jawline)
const FACE_CONTOUR_LEFT = [234, 93, 132, 58, 172, 136];
const FACE_CONTOUR_RIGHT = [454, 323, 361, 288, 397, 365];

// Cheekbone regions - more precise
const LEFT_CHEEK = [116, 123, 147, 187, 207, 206, 205, 36, 142, 126];
const RIGHT_CHEEK = [345, 352, 376, 411, 427, 426, 425, 266, 371, 355];

// Lip region
const LIPS_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185, 61];

// Nose region - bridge and sides
const NOSE_BRIDGE = [6, 197, 195, 5, 4, 45, 275, 4, 1, 19, 218, 438];

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

    // Canvas 1: R=skin (excluding eyes), G=eyes, B=face contour
    
    // Draw skin first
    this.ctx.fillStyle = '#ff0000';
    this.drawPoly(this.ctx, SKIN_INDICES, landmarks, toCanvas);
    
    // Cut out eye regions from skin (draw black over eyes)
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
    this.ctx.lineWidth = 25;
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

    // Nose - draw as thick line along bridge
    this.ctx2.strokeStyle = '#0000ff';
    this.ctx2.lineWidth = 30;
    this.ctx2.lineCap = 'round';
    this.ctx2.beginPath();
    NOSE_BRIDGE.forEach((idx, i) => {
      const lm = landmarks[idx];
      if (!lm) return;
      const { x, y } = toCanvas(lm);
      if (i === 0) this.ctx2.moveTo(x, y);
      else this.ctx2.lineTo(x, y);
    });
    this.ctx2.stroke();

    // Apply blur for soft edges
    this.applyBlur(this.ctx, this.canvas);
    this.applyBlur(this.ctx2, this.canvas2);
  }

  private applyBlur(ctx: OffscreenCanvasRenderingContext2D, canvas: OffscreenCanvas) {
    ctx.filter = 'blur(12px)';
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
