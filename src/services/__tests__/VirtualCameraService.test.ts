import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VirtualCameraService } from '../VirtualCameraService';

describe('VirtualCameraService', () => {
  let service: VirtualCameraService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new VirtualCameraService();
  });

  describe('constructor', () => {
    it('creates service instance', () => {
      expect(service).toBeInstanceOf(VirtualCameraService);
    });

    it('initializes with not running state', () => {
      expect(service.isRunning).toBe(false);
    });
  });

  describe('isSupported', () => {
    it('returns boolean', () => {
      const result = service.isSupported();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('start', () => {
    it('handles null canvas gracefully', async () => {
      const result = await service.start(null);
      expect(result).toBe(false);
    });
  });

  describe('stop', () => {
    it('can be called when not running', () => {
      expect(() => service.stop()).not.toThrow();
    });

    it('sets isRunning to false', () => {
      service.stop();
      expect(service.isRunning).toBe(false);
    });
  });

  describe('dispose', () => {
    it('cleans up without throwing', () => {
      expect(() => service.dispose()).not.toThrow();
    });

    it('can be called multiple times', () => {
      service.dispose();
      expect(() => service.dispose()).not.toThrow();
    });
  });

  describe('getStream', () => {
    it('returns null when not running', () => {
      expect(service.getStream()).toBeNull();
    });
  });
});
