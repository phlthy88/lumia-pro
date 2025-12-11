import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LutService } from '../LutService';

// Mock CDNService
vi.mock('../CDNService', () => ({
  cdnService: {
    loadLUT: vi.fn().mockRejectedValue(new Error('CDN not available')),
  },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('LutService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    LutService.clearCache();
  });

  describe('generateIdentity', () => {
    it('generates identity LUT with default size', () => {
      const lut = LutService.generateIdentity();

      expect(lut.name).toBe('Standard (Rec.709)');
      expect(lut.size).toBe(33);
      expect(lut.data).toBeInstanceOf(Float32Array);
      expect(lut.data.length).toBe(33 * 33 * 33 * 3);
    });

    it('generates identity LUT with custom size', () => {
      const lut = LutService.generateIdentity(17);

      expect(lut.size).toBe(17);
      expect(lut.data.length).toBe(17 * 17 * 17 * 3);
    });

    it('identity LUT has correct values at corners', () => {
      const lut = LutService.generateIdentity(2);

      // First entry (0,0,0) should be black
      expect(lut.data[0]).toBe(0);
      expect(lut.data[1]).toBe(0);
      expect(lut.data[2]).toBe(0);

      // Last entry (1,1,1) should be white
      const lastIdx = (2 * 2 * 2 - 1) * 3;
      expect(lut.data[lastIdx]).toBe(1);
      expect(lut.data[lastIdx + 1]).toBe(1);
      expect(lut.data[lastIdx + 2]).toBe(1);
    });
  });

  describe('generateTealOrange', () => {
    it('generates teal/orange LUT with default size', () => {
      const lut = LutService.generateTealOrange();

      expect(lut.name).toBe('Blockbuster (Teal/Orange)');
      expect(lut.size).toBe(33);
      expect(lut.data).toBeInstanceOf(Float32Array);
    });

    it('generates teal/orange LUT with custom size', () => {
      const lut = LutService.generateTealOrange(17);

      expect(lut.size).toBe(17);
      expect(lut.data.length).toBe(17 * 17 * 17 * 3);
    });

    it('teal/orange LUT modifies colors', () => {
      const identity = LutService.generateIdentity(8);
      const tealOrange = LutService.generateTealOrange(8);

      // Values should be different from identity
      let hasDifference = false;
      for (let i = 0; i < identity.data.length; i++) {
        if (Math.abs(identity.data[i]! - tealOrange.data[i]!) > 0.001) {
          hasDifference = true;
          break;
        }
      }
      expect(hasDifference).toBe(true);
    });
  });

  describe('parseCube', () => {
    it('parses valid .cube file', () => {
      const cubeContent = `
TITLE "Test LUT"
LUT_3D_SIZE 2
0.0 0.0 0.0
1.0 0.0 0.0
0.0 1.0 0.0
1.0 1.0 0.0
0.0 0.0 1.0
1.0 0.0 1.0
0.0 1.0 1.0
1.0 1.0 1.0
`;

      const lut = LutService.parseCube(cubeContent, 'Test');

      expect(lut.name).toBe('Test');
      expect(lut.size).toBe(2);
      expect(lut.data.length).toBe(2 * 2 * 2 * 3);
    });

    it('ignores comment lines', () => {
      const cubeContent = `
# This is a comment
LUT_3D_SIZE 2
# Another comment
0.0 0.0 0.0
1.0 0.0 0.0
0.0 1.0 0.0
1.0 1.0 0.0
0.0 0.0 1.0
1.0 0.0 1.0
0.0 1.0 1.0
1.0 1.0 1.0
`;

      const lut = LutService.parseCube(cubeContent, 'Test');
      expect(lut.size).toBe(2);
    });

    it('throws error when LUT_3D_SIZE missing', () => {
      const cubeContent = `
0.0 0.0 0.0
1.0 1.0 1.0
`;

      expect(() => LutService.parseCube(cubeContent, 'Test')).toThrow('LUT_3D_SIZE not found');
    });

    it('handles whitespace in values', () => {
      const cubeContent = `
LUT_3D_SIZE 2
0.0   0.0   0.0
1.0   0.0   0.0
0.0   1.0   0.0
1.0   1.0   0.0
0.0   0.0   1.0
1.0   0.0   1.0
0.0   1.0   1.0
1.0   1.0   1.0
`;

      const lut = LutService.parseCube(cubeContent, 'Test');
      expect(lut.data[0]).toBe(0);
      expect(lut.data[3]).toBe(1);
    });
  });

  describe('loadFromUrl', () => {
    it('loads LUT from URL', async () => {
      const cubeContent = `
LUT_3D_SIZE 2
0.0 0.0 0.0
1.0 0.0 0.0
0.0 1.0 0.0
1.0 1.0 0.0
0.0 0.0 1.0
1.0 0.0 1.0
0.0 1.0 1.0
1.0 1.0 1.0
`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(cubeContent),
      });

      const lut = await LutService.loadFromUrl('https://example.com/test.cube', 'Test');

      expect(lut.name).toBe('Test');
      expect(lut.size).toBe(2);
    });

    it('throws error on fetch failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(LutService.loadFromUrl('https://example.com/missing.cube', 'Test'))
        .rejects.toThrow('Failed to fetch');
    });
  });

  describe('loadCached', () => {
    it('caches loaded LUTs', async () => {
      const cubeContent = `
LUT_3D_SIZE 2
0.0 0.0 0.0
1.0 0.0 0.0
0.0 1.0 0.0
1.0 1.0 0.0
0.0 0.0 1.0
1.0 0.0 1.0
0.0 1.0 1.0
1.0 1.0 1.0
`;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(cubeContent),
      });

      await LutService.loadCached('https://example.com/test.cube', 'Test');
      await LutService.loadCached('https://example.com/test.cube', 'Test');

      // Should only fetch once
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('returns cached LUT on second call', async () => {
      const cubeContent = `
LUT_3D_SIZE 2
0.0 0.0 0.0
1.0 0.0 0.0
0.0 1.0 0.0
1.0 1.0 0.0
0.0 0.0 1.0
1.0 0.0 1.0
0.0 1.0 1.0
1.0 1.0 1.0
`;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(cubeContent),
      });

      const lut1 = await LutService.loadCached('https://example.com/test.cube', 'Test');
      const lut2 = await LutService.loadCached('https://example.com/test.cube', 'Test');

      expect(lut1).toBe(lut2);
    });
  });

  describe('clearCache', () => {
    it('clears all cached LUTs', async () => {
      const cubeContent = `
LUT_3D_SIZE 2
0.0 0.0 0.0
1.0 0.0 0.0
0.0 1.0 0.0
1.0 1.0 0.0
0.0 0.0 1.0
1.0 0.0 1.0
0.0 1.0 1.0
1.0 1.0 1.0
`;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(cubeContent),
      });

      await LutService.loadCached('https://example.com/test.cube', 'Test');
      expect(LutService.getCacheSize()).toBe(1);

      LutService.clearCache();
      expect(LutService.getCacheSize()).toBe(0);
    });
  });

  describe('getCacheSize', () => {
    it('returns current cache size', () => {
      expect(LutService.getCacheSize()).toBe(0);
    });
  });
});
