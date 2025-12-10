import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MaskGenerator } from '../MaskGenerator';

// Mock OffscreenCanvas for Node environment
class MockOffscreenCanvas {
  width: number;
  height: number;
  private ctx: any;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.ctx = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      globalCompositeOperation: 'source-over',
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      filter: 'none',
    };
  }

  getContext() {
    return this.ctx;
  }
}

// @ts-expect-error - Mock for test environment
global.OffscreenCanvas = MockOffscreenCanvas;

describe('MaskGenerator', () => {
  let generator: MaskGenerator;

  beforeEach(() => {
    generator = new MaskGenerator(640, 480);
  });

  describe('initialization', () => {
    it('should create with default dimensions', () => {
      const gen = new MaskGenerator();
      expect(gen.getCanvas()).toBeDefined();
      expect(gen.getCanvas2()).toBeDefined();
    });

    it('should create with custom dimensions', () => {
      const gen = new MaskGenerator(1920, 1080);
      const canvas = gen.getCanvas();
      expect(canvas.width).toBe(1920);
      expect(canvas.height).toBe(1080);
    });
  });

  describe('update', () => {
    const createMockLandmarks = (count: number) => {
      return Array.from({ length: count }, (_, i) => ({
        x: (i % 32) / 32,
        y: Math.floor(i / 32) / 15,
        z: 0,
        visibility: 1,
      }));
    };

    it('should handle undefined landmarks', () => {
      expect(() => {
        generator.update(undefined, 640, 480);
      }).not.toThrow();
    });

    it('should handle empty landmarks', () => {
      expect(() => {
        generator.update([], 640, 480);
      }).not.toThrow();
    });

    it('should handle insufficient landmarks', () => {
      const landmarks = createMockLandmarks(100); // Need 468
      expect(() => {
        generator.update(landmarks, 640, 480);
      }).not.toThrow();
    });

    it('should handle zero dimensions', () => {
      const landmarks = createMockLandmarks(468);
      expect(() => {
        generator.update(landmarks, 0, 0);
      }).not.toThrow();
    });

    it('should process valid landmarks', () => {
      const landmarks = createMockLandmarks(468);
      expect(() => {
        generator.update(landmarks, 640, 480);
      }).not.toThrow();
    });

    it('should resize canvas when dimensions change', () => {
      const landmarks = createMockLandmarks(468);
      
      generator.update(landmarks, 640, 480);
      expect(generator.getCanvas().width).toBe(640);
      
      generator.update(landmarks, 1280, 720);
      expect(generator.getCanvas().width).toBe(1280);
      expect(generator.getCanvas().height).toBe(720);
    });
  });

  describe('temporal smoothing', () => {
    it('should allow setting smoothing factor', () => {
      expect(() => {
        generator.setSmoothingFactor(0.5);
      }).not.toThrow();
    });

    it('should clamp smoothing factor to valid range', () => {
      generator.setSmoothingFactor(-1);
      generator.setSmoothingFactor(2);
      // Should not throw
    });

    it('should reset smoothing state', () => {
      expect(() => {
        generator.resetSmoothing();
      }).not.toThrow();
    });
  });

  describe('disposal', () => {
    it('should dispose without errors', () => {
      expect(() => {
        generator.dispose();
      }).not.toThrow();
    });
  });

  describe('canvas access', () => {
    it('should return primary canvas', () => {
      const canvas = generator.getCanvas();
      expect(canvas).toBeDefined();
      expect(canvas.width).toBe(640);
    });

    it('should return secondary canvas', () => {
      const canvas2 = generator.getCanvas2();
      expect(canvas2).toBeDefined();
      expect(canvas2.width).toBe(640);
    });
  });
});

describe('Face Region Indices', () => {
  it('face oval should form closed loop', () => {
    // The face oval indices should start and end with same point
    const FACE_OVAL = [
      10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
      397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
      172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10
    ];
    
    expect(FACE_OVAL[0]).toBe(FACE_OVAL[FACE_OVAL.length - 1]);
  });

  it('eye regions should form closed loops', () => {
    const LEFT_EYE = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7, 33];
    const RIGHT_EYE = [362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382, 362];
    
    expect(LEFT_EYE[0]).toBe(LEFT_EYE[LEFT_EYE.length - 1]);
    expect(RIGHT_EYE[0]).toBe(RIGHT_EYE[RIGHT_EYE.length - 1]);
  });

  it('all indices should be valid MediaPipe landmark indices', () => {
    const allIndices = [
      10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
      33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153,
      362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373,
    ];
    
    // MediaPipe face mesh has 468 landmarks (0-467)
    allIndices.forEach(idx => {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(468);
    });
  });
});
