// Unit tests for LutService
// To run tests, first install dependencies:
// npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
// Then run: npm test

import { describe, it, expect } from 'vitest';
import { LutService } from '../LutService';

describe('LutService', () => {
  describe('generateIdentity', () => {
    it('should generate identity LUT with correct size', () => {
      const lut = LutService.generateIdentity(33);
      expect(lut.size).toBe(33);
      expect(lut.data.length).toBe(33 * 33 * 33 * 3);
      expect(lut.name).toBe('Standard (Rec.709)');
    });

    it('should generate valid identity values', () => {
      const lut = LutService.generateIdentity(2);
      expect(lut.data[0]).toBe(0); // R at (0,0,0)
      expect(lut.data[1]).toBe(0); // G at (0,0,0)
      expect(lut.data[2]).toBe(0); // B at (0,0,0)
    });
  });

  describe('parseCube', () => {
    it('should parse valid CUBE file', () => {
      const content = `LUT_3D_SIZE 2
0.0 0.0 0.0
1.0 0.0 0.0
0.0 1.0 0.0
1.0 1.0 0.0
0.0 0.0 1.0
1.0 0.0 1.0
0.0 1.0 1.0
1.0 1.0 1.0`;
      
      const lut = LutService.parseCube(content, 'test');
      expect(lut.size).toBe(2);
      expect(lut.name).toBe('test');
      expect(lut.data.length).toBe(24);
    });

    it('should throw error when LUT_3D_SIZE is missing', () => {
      const content = `0.0 0.0 0.0\n1.0 1.0 1.0`;
      expect(() => LutService.parseCube(content, 'test')).toThrow('LUT_3D_SIZE not found');
    });

    it('should skip comments and metadata', () => {
      const content = `# Comment
TITLE "Test LUT"
LUT_3D_SIZE 2
0.0 0.0 0.0
1.0 0.0 0.0
0.0 1.0 0.0
1.0 1.0 0.0
0.0 0.0 1.0
1.0 0.0 1.0
0.0 1.0 1.0
1.0 1.0 1.0`;
      
      const lut = LutService.parseCube(content, 'test');
      expect(lut.size).toBe(2);
    });
  });

  describe('loadFromUrl', () => {
    it('should throw error on network failure', async () => {
      await expect(
        LutService.loadFromUrl('/nonexistent.cube', 'test')
      ).rejects.toThrow();
    });
  });
});
