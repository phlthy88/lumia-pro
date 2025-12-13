import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock MediaPipe before importing BackgroundBlur
vi.mock('@mediapipe/tasks-vision', () => ({
  FilesetResolver: {
    forVisionTasks: vi.fn().mockResolvedValue({})
  },
  ImageSegmenter: {
    createFromOptions: vi.fn().mockResolvedValue({
      segmentForVideo: vi.fn(),
      close: vi.fn()
    })
  }
}));

import { BackgroundBlur } from '../BackgroundBlur';

describe('BackgroundBlur', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('creates instance with default dimensions', () => {
      const blur = new BackgroundBlur();
      expect(blur).toBeInstanceOf(BackgroundBlur);
      expect(blur.getCanvas()).toBeInstanceOf(OffscreenCanvas);
    });

    it('creates instance and returns canvas', () => {
      const blur = new BackgroundBlur(1280, 720);
      const canvas = blur.getCanvas();
      expect(canvas).toBeInstanceOf(OffscreenCanvas);
    });
  });

  describe('initialize', () => {
    it('initializes MediaPipe segmenter', async () => {
      const { FilesetResolver, ImageSegmenter } = await import('@mediapipe/tasks-vision');
      const blur = new BackgroundBlur();
      
      const result = await blur.initialize();
      
      expect(result).toBe(true);
      expect(FilesetResolver.forVisionTasks).toHaveBeenCalled();
      expect(ImageSegmenter.createFromOptions).toHaveBeenCalled();
      expect(blur.isReady()).toBe(true);
    });

    it('does not reinitialize if already initialized', async () => {
      const { ImageSegmenter } = await import('@mediapipe/tasks-vision');
      const blur = new BackgroundBlur();
      
      await blur.initialize();
      await blur.initialize();
      
      expect(ImageSegmenter.createFromOptions).toHaveBeenCalledTimes(1);
    });

    it('sets hasFailed after max retries', async () => {
      const { FilesetResolver } = await import('@mediapipe/tasks-vision');
      const blur = new BackgroundBlur();
      
      // Mock 3 failures (maxRetries)
      const mockFilesetResolver = FilesetResolver.forVisionTasks as ReturnType<typeof vi.fn>;
      mockFilesetResolver.mockRejectedValueOnce(new Error('Network error'));
      await blur.initialize();
      expect(blur.hasFailed()).toBe(false); // Should allow retry
      
      mockFilesetResolver.mockRejectedValueOnce(new Error('Network error'));
      await blur.initialize();
      expect(blur.hasFailed()).toBe(false); // Should allow retry
      
      mockFilesetResolver.mockRejectedValueOnce(new Error('Network error'));
      const result = await blur.initialize();
      
      expect(result).toBe(false);
      expect(blur.hasFailed()).toBe(true); // Should fail after max retries
    });
  });

  describe('segment', () => {
    it('returns null when not initialized', () => {
      const blur = new BackgroundBlur();
      const video = document.createElement('video');
      
      const result = blur.segment(video);
      
      expect(result).toBeNull();
    });

    it('returns null when initialization failed', async () => {
      const { FilesetResolver } = await import('@mediapipe/tasks-vision');
      (FilesetResolver.forVisionTasks as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('fail'));
      
      const blur = new BackgroundBlur();
      await blur.initialize();
      
      const video = document.createElement('video');
      const result = blur.segment(video);
      
      expect(result).toBeNull();
    });
  });

  describe('dispose', () => {
    it('cleans up segmenter', async () => {
      const { ImageSegmenter } = await import('@mediapipe/tasks-vision');
      const mockClose = vi.fn();
      (ImageSegmenter.createFromOptions as ReturnType<typeof vi.fn>).mockResolvedValue({
        segmentForVideo: vi.fn(),
        close: mockClose
      });
      
      const blur = new BackgroundBlur();
      await blur.initialize();
      blur.dispose();
      
      expect(mockClose).toHaveBeenCalled();
      expect(blur.isReady()).toBe(false);
    });

    it('handles dispose when not initialized', () => {
      const blur = new BackgroundBlur();
      expect(() => blur.dispose()).not.toThrow();
    });
  });
});
