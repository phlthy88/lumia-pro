import { browserCompatibilityService } from '../BrowserCompatibilityService';

// Mock browser APIs
const mockGetContext = jest.fn();
const mockCanvas = {
  getContext: mockGetContext
};

Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => mockCanvas),
  writable: true
});

describe('BrowserCompatibilityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton instance
    (browserCompatibilityService as any).compatibilityResult = null;
  });

  describe('checkCompatibility', () => {
    it('detects WebGL2 support', () => {
      mockGetContext.mockReturnValue({}); // Mock WebGL2 context
      
      const result = browserCompatibilityService.checkCompatibility();
      
      expect(result.missingFeatures).not.toContain('WebGL 2.0');
    });

    it('detects missing WebGL2', () => {
      mockGetContext.mockReturnValue(null);
      
      const result = browserCompatibilityService.checkCompatibility();
      
      expect(result.missingFeatures).toContain('WebGL 2.0');
      expect(result.isSupported).toBe(false);
    });

    it('detects MediaDevices API', () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: jest.fn() },
        configurable: true
      });
      
      const result = browserCompatibilityService.checkCompatibility();
      
      expect(result.missingFeatures).not.toContain('MediaDevices API');
    });

    it('detects missing MediaDevices API', () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: undefined,
        configurable: true
      });
      
      const result = browserCompatibilityService.checkCompatibility();
      
      expect(result.missingFeatures).toContain('MediaDevices API');
    });

    it('caches compatibility results', () => {
      const spy = jest.spyOn(document, 'createElement');
      
      browserCompatibilityService.checkCompatibility();
      browserCompatibilityService.checkCompatibility();
      
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getFallbackConfig', () => {
    it('returns appropriate fallback config for unsupported browser', () => {
      mockGetContext.mockReturnValue(null); // No WebGL2
      
      const config = browserCompatibilityService.getFallbackConfig();
      
      expect(config.disableWebGL2).toBe(true);
      expect(config.reduceQuality).toBe(true);
      expect(config.maxResolution).toEqual({ width: 1280, height: 720 });
    });

    it('returns minimal restrictions for supported browser', () => {
      mockGetContext.mockReturnValue({}); // Has WebGL2
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: jest.fn() },
        configurable: true
      });
      
      const config = browserCompatibilityService.getFallbackConfig();
      
      expect(config.disableWebGL2).toBe(false);
    });
  });
});
