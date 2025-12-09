import { describe, it, expect, vi } from 'vitest';

describe('AIAnalysisService disposal', () => {
  it('is safe to call dispose multiple times', async () => {
    // Mock OffscreenCanvas
    (global as any).OffscreenCanvas = class {
      width = 256;
      height = 144;
      getContext() {
        return { drawImage: vi.fn(), getImageData: vi.fn(() => new ImageData(256, 144)), clearRect: vi.fn() };
      }
    };

    const { AIAnalysisService } = await import('../AIAnalysisService');
    const service = new AIAnalysisService();

    expect(() => {
      service.dispose();
      service.dispose();
    }).not.toThrow();
  });
});
