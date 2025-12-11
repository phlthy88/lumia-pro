import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OffscreenCanvasService } from '../OffscreenCanvasService';

// Mock browser context classes
class MockCanvasRenderingContext2D {}
class MockWebGLRenderingContext {}
class MockWebGL2RenderingContext {}

vi.stubGlobal('CanvasRenderingContext2D', MockCanvasRenderingContext2D);
vi.stubGlobal('WebGLRenderingContext', MockWebGLRenderingContext);
vi.stubGlobal('WebGL2RenderingContext', MockWebGL2RenderingContext);

describe('OffscreenCanvasService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    OffscreenCanvasService.resetCache();
  });

  describe('isSupported', () => {
    it('should return false when OffscreenCanvas is undefined', () => {
      vi.stubGlobal('OffscreenCanvas', undefined);
      OffscreenCanvasService.resetCache();
      expect(OffscreenCanvasService.isSupported()).toBe(false);
    });

    it('should return true when OffscreenCanvas works correctly', () => {
      const mockContext = new MockCanvasRenderingContext2D();
      
      // Create proper constructor function
      function MockOffscreenCanvas() {
        return {
          getContext: () => mockContext
        };
      }
      
      vi.stubGlobal('OffscreenCanvas', MockOffscreenCanvas);
      OffscreenCanvasService.resetCache();
      
      expect(OffscreenCanvasService.isSupported()).toBe(true);
    });

    it('should return false when OffscreenCanvas throws error', () => {
      function MockOffscreenCanvas() {
        throw new Error('Not supported');
      }
      
      vi.stubGlobal('OffscreenCanvas', MockOffscreenCanvas);
      OffscreenCanvasService.resetCache();
      
      expect(OffscreenCanvasService.isSupported()).toBe(false);
    });
  });

  describe('create', () => {
    it('should return null when not supported', () => {
      vi.stubGlobal('OffscreenCanvas', undefined);
      OffscreenCanvasService.resetCache();
      expect(OffscreenCanvasService.create(100, 100)).toBe(null);
    });

    it('should create OffscreenCanvas when supported', () => {
      const mockContext = new MockCanvasRenderingContext2D();
      const mockCanvas = { getContext: () => mockContext };
      
      function MockOffscreenCanvas() {
        return mockCanvas;
      }
      
      vi.stubGlobal('OffscreenCanvas', MockOffscreenCanvas);
      OffscreenCanvasService.resetCache();
      
      const result = OffscreenCanvasService.create(100, 100);
      expect(result).toBe(mockCanvas);
    });
  });

  describe('getContext', () => {
    it('should return context when successful', () => {
      const mockContext = new MockCanvasRenderingContext2D();
      const mockCanvas = { 
        getContext: vi.fn().mockReturnValue(mockContext)
      };
      
      const result = OffscreenCanvasService.getContext(mockCanvas as any, '2d');
      expect(result).toBe(mockContext);
    });

    it('should return null when getContext throws', () => {
      const mockCanvas = { 
        getContext: vi.fn().mockImplementation(() => {
          throw new Error('Context not supported');
        })
      };
      
      const result = OffscreenCanvasService.getContext(mockCanvas as any, '2d');
      expect(result).toBe(null);
    });

    it('should return null when context is not a recognized type', () => {
      const mockContext = {}; // Not an instance of any recognized context class
      const mockCanvas = { 
        getContext: vi.fn().mockReturnValue(mockContext)
      };
      
      const result = OffscreenCanvasService.getContext(mockCanvas as any, '2d');
      expect(result).toBe(null);
    });
  });
});
