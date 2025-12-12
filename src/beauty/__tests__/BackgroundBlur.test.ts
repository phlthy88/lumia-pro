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
      
      await blur.initialize();
      
      expect(FilesetResolver.forVisionTasks).toHaveBeenCalled();
      expect(ImageSegmenter.createFromOptions).toHaveBeenCalled();
    });

    it('does not reinitialize if already initialized', async () => {
      const { ImageSegmenter } = await import('@mediapipe/tasks-vision');
      const blur = new BackgroundBlur();
      
      await blur.initialize();
      await blur.initialize();
      
      expect(ImageSegmenter.createFromOptions).toHaveBeenCalledTimes(1);
    });
  });

  describe('segment', () => {
    it('returns null when not initialized', () => {
      const blur = new BackgroundBlur();
      const video = document.createElement('video');
      
      const result = blur.segment(video);
      
      expect(result).toBeNull();
    });

    it('triggers initialization when called without init', async () => {
      const { FilesetResolver } = await import('@mediapipe/tasks-vision');
      const blur = new BackgroundBlur();
      const video = document.createElement('video');
      
      blur.segment(video);
      
      // Should trigger async initialization
      await new Promise(r => setTimeout(r, 10));
      expect(FilesetResolver.forVisionTasks).toHaveBeenCalled();
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
    });

    it('handles dispose when not initialized', () => {
      const blur = new BackgroundBlur();
      expect(() => blur.dispose()).not.toThrow();
    });
  });
});
