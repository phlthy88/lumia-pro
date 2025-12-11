import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIAnalysisService } from '../AIAnalysisService';

// Mock OffscreenCanvas
const mockCtx = {
  drawImage: vi.fn(),
  getImageData: vi.fn(),
  clearRect: vi.fn(),
};

class MockOffscreenCanvas {
  width = 256;
  height = 144;
  getContext() {
    return mockCtx;
  }
}

(global as any).OffscreenCanvas = MockOffscreenCanvas;

describe('AIAnalysisService', () => {
  let service: AIAnalysisService;

  // Helper to create mock ImageData with specific RGB values
  const createMockImageData = (r: number, g: number, b: number) => {
    const data = new Uint8ClampedArray(256 * 144 * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
    return { data, width: 256, height: 144 };
  };

  const mockVideo = {
    videoWidth: 1920,
    videoHeight: 1080,
  } as HTMLVideoElement;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    service = new AIAnalysisService();
  });

  afterEach(() => {
    service.dispose();
    vi.useRealTimers();
  });

  describe('analyze', () => {
    it('detects dark scenes and suggests exposure boost', async () => {
      mockCtx.getImageData.mockReturnValue(createMockImageData(30, 30, 30));

      const result = await service.analyze(mockVideo);

      expect(result.type).toBe('heuristic');
      expect(result.tips).toContain('Scene is too dark. Add lighting or increase ISO.');
      expect(result.autoParams.exposure).toBeGreaterThan(0);
      expect(result.score.exposure).toBeLessThan(100);
    });

    it('detects overexposed scenes', async () => {
      mockCtx.getImageData.mockReturnValue(createMockImageData(240, 240, 240));

      const result = await service.analyze(mockVideo);

      expect(result.tips).toContain('Scene is overexposed. Reduce gain.');
      expect(result.autoParams.exposure).toBeLessThan(0);
    });

    it('detects low contrast (flat image)', async () => {
      // All pixels same value = no dynamic range
      mockCtx.getImageData.mockReturnValue(createMockImageData(128, 128, 128));

      const result = await service.analyze(mockVideo);

      expect(result.tips).toContain('Image looks flat. Increasing contrast.');
      expect(result.autoParams.contrast).toBeGreaterThan(1);
    });

    it('detects warm (orange) color cast', async () => {
      mockCtx.getImageData.mockReturnValue(createMockImageData(180, 128, 100));

      const result = await service.analyze(mockVideo);

      expect(result.tips).toContain('Image is too warm (Orange). Cooling down.');
      expect(result.autoParams.temperature).toBeLessThan(0);
    });

    it('detects cool (blue) color cast', async () => {
      mockCtx.getImageData.mockReturnValue(createMockImageData(100, 128, 180));

      const result = await service.analyze(mockVideo);

      expect(result.tips).toContain('Image is too cool (Blue). Warming up.');
      expect(result.autoParams.temperature).toBeGreaterThan(0);
    });

    it('handles face detection results', async () => {
      mockCtx.getImageData.mockReturnValue(createMockImageData(128, 128, 128));

      const faceResult = {
        faceLandmarks: [[
          { x: 0.5, y: 0.4, z: 0 }, // index 0
          { x: 0.5, y: 0.4, z: 0 }, // nose at index 1
        ]],
        faceBlendshapes: [],
        facialTransformationMatrixes: [],
      };

      const result = await service.analyze(mockVideo, faceResult);

      expect(result.faces).toBe(1);
      expect(result.autoParams.portraitLight).toBe(0.3);
    });

    it('detects off-center face', async () => {
      mockCtx.getImageData.mockReturnValue(createMockImageData(128, 128, 128));

      const faceResult = {
        faceLandmarks: [[
          { x: 0.1, y: 0.4, z: 0 },
          { x: 0.1, y: 0.4, z: 0 }, // nose far left
        ]],
        faceBlendshapes: [],
        facialTransformationMatrixes: [],
      };

      const result = await service.analyze(mockVideo, faceResult);

      expect(result.tips).toContain('You are off-center. Move to the center.');
      expect(result.score.composition).toBeLessThan(100);
    });

    it('detects incorrect headroom', async () => {
      mockCtx.getImageData.mockReturnValue(createMockImageData(128, 128, 128));

      const faceResult = {
        faceLandmarks: [[
          { x: 0.5, y: 0.8, z: 0 },
          { x: 0.5, y: 0.8, z: 0 }, // nose too low
        ]],
        faceBlendshapes: [],
        facialTransformationMatrixes: [],
      };

      const result = await service.analyze(mockVideo, faceResult);

      expect(result.tips).toContain('Headroom incorrect. Adjust camera tilt.');
    });

    it('handles no face detected', async () => {
      mockCtx.getImageData.mockReturnValue(createMockImageData(128, 128, 128));

      const result = await service.analyze(mockVideo, null);

      expect(result.faces).toBe(0);
      expect(result.tips).toContain('No face detected. Cannot optimize for portrait.');
    });

    it('handles empty face landmarks array', async () => {
      mockCtx.getImageData.mockReturnValue(createMockImageData(128, 128, 128));

      const faceResult = {
        faceLandmarks: [],
        faceBlendshapes: [],
        facialTransformationMatrixes: [],
      };

      const result = await service.analyze(mockVideo, faceResult);

      expect(result.faces).toBe(0);
    });

    it('returns overall score', async () => {
      mockCtx.getImageData.mockReturnValue(createMockImageData(128, 128, 128));

      const result = await service.analyze(mockVideo);

      expect(result.score.overall).toBeGreaterThanOrEqual(0);
      expect(result.score.overall).toBeLessThanOrEqual(100);
    });

    it('limits tips to 3', async () => {
      mockCtx.getImageData.mockReturnValue(createMockImageData(30, 30, 30));

      const result = await service.analyze(mockVideo);

      expect(result.tips.length).toBeLessThanOrEqual(3);
    });
  });

  describe('analyzeWithRateLimit', () => {
    it('debounces rapid calls', async () => {
      mockCtx.getImageData.mockReturnValue(createMockImageData(128, 128, 128));

      const promise = service.analyzeWithRateLimit(mockVideo);
      
      // Advance past debounce period
      vi.advanceTimersByTime(500);
      
      const result = await promise;
      expect(result).not.toBeNull();
    });

    it('throttles to max once per 2 seconds', async () => {
      mockCtx.getImageData.mockReturnValue(createMockImageData(128, 128, 128));

      // First call
      const promise1 = service.analyzeWithRateLimit(mockVideo);
      vi.advanceTimersByTime(500);
      await promise1;

      // Immediate second call should be throttled
      const result2 = await service.analyzeWithRateLimit(mockVideo);
      expect(result2).toBeNull();
    });

    it('allows analysis after throttle period', async () => {
      mockCtx.getImageData.mockReturnValue(createMockImageData(128, 128, 128));

      // First call
      const promise1 = service.analyzeWithRateLimit(mockVideo);
      vi.advanceTimersByTime(500);
      await promise1;

      // Wait for throttle period
      vi.advanceTimersByTime(2000);

      // Should work now
      const promise2 = service.analyzeWithRateLimit(mockVideo);
      vi.advanceTimersByTime(500);
      const result2 = await promise2;
      expect(result2).not.toBeNull();
    });

    it('cancels previous debounce on new call', async () => {
      mockCtx.getImageData.mockReturnValue(createMockImageData(128, 128, 128));

      // Start first call
      service.analyzeWithRateLimit(mockVideo);
      
      // Advance partially
      vi.advanceTimersByTime(200);
      
      // Start second call (should cancel first)
      const promise2 = service.analyzeWithRateLimit(mockVideo);
      
      // Advance past debounce
      vi.advanceTimersByTime(500);
      
      const result = await promise2;
      expect(result).not.toBeNull();
    });
  });

  describe('dispose', () => {
    it('clears pending timeouts', () => {
      mockCtx.getImageData.mockReturnValue(createMockImageData(128, 128, 128));
      
      // Start a rate-limited analysis
      service.analyzeWithRateLimit(mockVideo);
      
      // Dispose before it completes
      expect(() => service.dispose()).not.toThrow();
    });

    it('can be called multiple times safely', () => {
      service.dispose();
      expect(() => service.dispose()).not.toThrow();
    });
  });

  describe('score calculations', () => {
    it('calculates exposure score based on luma', async () => {
      // Very dark image
      mockCtx.getImageData.mockReturnValue(createMockImageData(20, 20, 20));
      const darkResult = await service.analyze(mockVideo);
      
      // Normal image
      mockCtx.getImageData.mockReturnValue(createMockImageData(128, 128, 128));
      const normalResult = await service.analyze(mockVideo);
      
      expect(darkResult.score.exposure).toBeLessThan(normalResult.score.exposure);
    });

    it('calculates focus score based on face detection', async () => {
      mockCtx.getImageData.mockReturnValue(createMockImageData(128, 128, 128));
      
      // With face
      const faceResult = {
        faceLandmarks: [[{ x: 0.5, y: 0.4, z: 0 }, { x: 0.5, y: 0.4, z: 0 }]],
        faceBlendshapes: [],
        facialTransformationMatrixes: [],
      };
      const withFace = await service.analyze(mockVideo, faceResult);
      
      // Without face
      const withoutFace = await service.analyze(mockVideo, null);
      
      expect(withFace.score.focus).toBeGreaterThan(withoutFace.score.focus);
    });
  });

  describe('auto params', () => {
    it('suggests shadows boost for dark images', async () => {
      mockCtx.getImageData.mockReturnValue(createMockImageData(30, 30, 30));
      
      const result = await service.analyze(mockVideo);
      
      expect(result.autoParams.shadows).toBeGreaterThan(0);
    });

    it('suggests highlights reduction for bright images', async () => {
      mockCtx.getImageData.mockReturnValue(createMockImageData(240, 240, 240));
      
      const result = await service.analyze(mockVideo);
      
      expect(result.autoParams.highlights).toBeLessThan(0);
    });

    it('suggests blacks adjustment for flat images', async () => {
      mockCtx.getImageData.mockReturnValue(createMockImageData(128, 128, 128));
      
      const result = await service.analyze(mockVideo);
      
      expect(result.autoParams.blacks).toBeDefined();
    });
  });
});
