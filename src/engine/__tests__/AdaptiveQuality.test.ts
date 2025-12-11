import { describe, it, expect, beforeEach } from 'vitest';
import { AdaptiveQuality } from '../AdaptiveQuality';

describe('AdaptiveQuality', () => {
  let aq: AdaptiveQuality;

  beforeEach(() => {
    aq = new AdaptiveQuality();
  });

  describe('addFrameTime', () => {
    it('adds frame time to history', () => {
      aq.addFrameTime(16.67);
      expect(aq.getAverageFrameTime()).toBeCloseTo(16.67);
    });

    it('limits history to window size', () => {
      // Add more than window size (150)
      for (let i = 0; i < 200; i++) {
        aq.addFrameTime(16.67);
      }
      // Should still work without error
      expect(aq.getAverageFrameTime()).toBeCloseTo(16.67);
    });
  });

  describe('getRecommendation', () => {
    it('returns high tier with insufficient samples', () => {
      aq.addFrameTime(16.67);
      const rec = aq.getRecommendation();

      expect(rec.tier).toBe('high');
      expect(rec.resolutionScale).toBe(1.0);
      expect(rec.targetFps).toBe(60);
      expect(rec.beautyEnabled).toBe(true);
    });

    it('returns high tier for 60fps', () => {
      // 60fps = 16.67ms per frame
      for (let i = 0; i < 50; i++) {
        aq.addFrameTime(16.67);
      }
      const rec = aq.getRecommendation();

      expect(rec.tier).toBe('high');
      expect(rec.resolutionScale).toBe(1.0);
    });

    it('returns medium tier for ~20fps', () => {
      // 20fps = 50ms per frame
      for (let i = 0; i < 50; i++) {
        aq.addFrameTime(50);
      }
      const rec = aq.getRecommendation();

      expect(rec.tier).toBe('medium');
      expect(rec.resolutionScale).toBe(0.85);
      expect(rec.targetFps).toBe(30);
      expect(rec.beautyEnabled).toBe(true);
    });

    it('returns low tier for <17fps', () => {
      // 15fps = 66.67ms per frame
      for (let i = 0; i < 50; i++) {
        aq.addFrameTime(66.67);
      }
      const rec = aq.getRecommendation();

      expect(rec.tier).toBe('low');
      expect(rec.resolutionScale).toBe(0.65);
      expect(rec.targetFps).toBe(30);
      expect(rec.beautyEnabled).toBe(false);
      expect(rec.reason).toContain('Low FPS');
    });
  });

  describe('getAverageFrameTime', () => {
    it('returns 0 with no samples', () => {
      expect(aq.getAverageFrameTime()).toBe(0);
    });

    it('returns average of samples', () => {
      aq.addFrameTime(10);
      aq.addFrameTime(20);
      aq.addFrameTime(30);

      expect(aq.getAverageFrameTime()).toBe(20);
    });
  });

  describe('getAverageFps', () => {
    it('returns 0 with no samples', () => {
      expect(aq.getAverageFps()).toBe(0);
    });

    it('calculates FPS from frame time', () => {
      // 16.67ms = 60fps
      for (let i = 0; i < 10; i++) {
        aq.addFrameTime(16.67);
      }

      expect(aq.getAverageFps()).toBeCloseTo(60, 0);
    });

    it('calculates FPS for 30fps', () => {
      // 33.33ms = 30fps
      for (let i = 0; i < 10; i++) {
        aq.addFrameTime(33.33);
      }

      expect(aq.getAverageFps()).toBeCloseTo(30, 0);
    });
  });

  describe('shouldDownscale', () => {
    it('returns false with insufficient bad samples', () => {
      // Add some bad samples but not enough
      for (let i = 0; i < 40; i++) {
        aq.addFrameTime(100); // Very slow
      }

      expect(aq.shouldDownscale()).toBe(false);
    });

    it('returns false when FPS is good', () => {
      for (let i = 0; i < 100; i++) {
        aq.addFrameTime(16.67);
      }

      expect(aq.shouldDownscale()).toBe(false);
    });
  });

  describe('reset', () => {
    it('clears all state', () => {
      // Add some data
      for (let i = 0; i < 50; i++) {
        aq.addFrameTime(100);
      }

      aq.reset();

      expect(aq.getAverageFrameTime()).toBe(0);
      expect(aq.getAverageFps()).toBe(0);
    });
  });
});
