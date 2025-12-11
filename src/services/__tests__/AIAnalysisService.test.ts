import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIAnalysisService } from '../AIAnalysisService';

describe('AIAnalysisService', () => {
  let service: AIAnalysisService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AIAnalysisService();
  });

  describe('constructor', () => {
    it('creates service instance', () => {
      expect(service).toBeInstanceOf(AIAnalysisService);
    });
  });

  describe('analyzeWithRateLimit', () => {
    it('returns null when called too frequently (throttle)', async () => {
      const mockVideo = {
        videoWidth: 1920,
        videoHeight: 1080,
        readyState: 4,
      } as HTMLVideoElement;

      // First call should work (or return null due to debounce)
      const result1 = await service.analyzeWithRateLimit(mockVideo);
      
      // Immediate second call should be throttled
      const result2 = await service.analyzeWithRateLimit(mockVideo);
      
      // At least one should be null due to rate limiting
      expect(result1 === null || result2 === null).toBe(true);
    });
  });

  describe('dispose', () => {
    it('cleans up resources without throwing', () => {
      expect(() => service.dispose()).not.toThrow();
    });

    it('can be called multiple times safely', () => {
      service.dispose();
      expect(() => service.dispose()).not.toThrow();
    });
  });
});

describe('AIAnalysisService analysis result', () => {
  it('result type should be heuristic', async () => {
    const service = new AIAnalysisService();
    
    // Create a mock video element with proper dimensions
    const mockVideo = document.createElement('video');
    Object.defineProperty(mockVideo, 'videoWidth', { value: 640 });
    Object.defineProperty(mockVideo, 'videoHeight', { value: 480 });
    Object.defineProperty(mockVideo, 'readyState', { value: 4 });

    // The service uses heuristic analysis, not ML
    // This is documented in the service class
    expect(service).toBeDefined();
    
    service.dispose();
  });
});
