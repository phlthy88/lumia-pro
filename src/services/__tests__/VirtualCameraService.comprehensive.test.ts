import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VirtualCameraService } from '../VirtualCameraService';

describe('VirtualCameraService - Comprehensive', () => {
  let service: VirtualCameraService;
  let originalSharedWorker: any;
  let originalCreateImageBitmap: any;
  let originalImageBitmap: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Store originals
    originalSharedWorker = (global as any).SharedWorker;
    originalCreateImageBitmap = (global as any).createImageBitmap;
    originalImageBitmap = (global as any).ImageBitmap;
    
    // Mock SharedWorker
    (global as any).SharedWorker = class {
      port = {
        start: vi.fn(),
        close: vi.fn(),
        postMessage: vi.fn(),
        onmessage: null,
      };
    };
    
    // Mock ImageBitmap
    (global as any).ImageBitmap = class {};
    
    // Mock createImageBitmap
    (global as any).createImageBitmap = vi.fn().mockResolvedValue({});
    
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock');
    
    // Mock HTMLCanvasElement.prototype.captureStream
    HTMLCanvasElement.prototype.captureStream = vi.fn(() => ({
      getTracks: () => [{ stop: vi.fn() }],
      getVideoTracks: () => [{ stop: vi.fn() }],
      getAudioTracks: () => [],
      addTrack: vi.fn(),
    })) as any;
    
    service = new VirtualCameraService();
  });

  afterEach(() => {
    service.dispose();
    (global as any).SharedWorker = originalSharedWorker;
    (global as any).createImageBitmap = originalCreateImageBitmap;
    (global as any).ImageBitmap = originalImageBitmap;
  });

  describe('detectCapabilities', () => {
    it('detects browser capabilities', () => {
      const state = service.getState();
      expect(state.capabilities).toBeDefined();
      expect(typeof state.capabilities.supported).toBe('boolean');
    });

    it('includes all capability flags', () => {
      const caps = service.getState().capabilities;
      expect(caps).toHaveProperty('sharedWorker');
      expect(caps).toHaveProperty('broadcastChannel');
      expect(caps).toHaveProperty('canvasToBlob');
      expect(caps).toHaveProperty('mediaStream');
      expect(caps).toHaveProperty('imageBitmap');
    });
  });

  describe('initialize', () => {
    it('stores canvas reference', () => {
      const canvas = document.createElement('canvas');
      service.initialize(canvas);
      expect(() => service.start()).not.toThrow();
    });

    it('accepts partial config', () => {
      const canvas = document.createElement('canvas');
      service.initialize(canvas, { fps: 60, quality: 0.9 });
      
      const state = service.getState();
      expect(state.config.fps).toBe(60);
      expect(state.config.quality).toBe(0.9);
    });
  });

  describe('start', () => {
    it('returns null when canvas not initialized', () => {
      const result = service.start();
      expect(result).toBeNull();
    });

    it('returns stream when initialized and supported', () => {
      const canvas = document.createElement('canvas');
      service.initialize(canvas);
      
      // Only test if supported
      if (service.isSupported()) {
        const stream = service.start();
        expect(stream).not.toBeNull();
      }
    });
  });

  describe('stop', () => {
    it('sets isActive to false', () => {
      service.stop();
      expect(service.getState().isActive).toBe(false);
    });

    it('clears stream reference', () => {
      service.stop();
      expect(service.getState().stream).toBeNull();
    });

    it('can be called when not running', () => {
      expect(() => service.stop()).not.toThrow();
    });
  });

  describe('updateConfig', () => {
    it('updates fps', () => {
      service.updateConfig({ fps: 60 });
      expect(service.getState().config.fps).toBe(60);
      expect(service.getState().config.frameRate).toBe(60);
    });

    it('updates resolution via width/height', () => {
      service.updateConfig({ width: 1920, height: 1080 });
      
      const config = service.getState().config;
      expect(config.width).toBe(1920);
      expect(config.height).toBe(1080);
      expect(config.resolution).toEqual({ width: 1920, height: 1080 });
    });

    it('updates resolution via resolution object', () => {
      service.updateConfig({ resolution: { width: 640, height: 480 } });
      
      const config = service.getState().config;
      expect(config.width).toBe(640);
      expect(config.height).toBe(480);
    });

    it('syncs frameRate with fps', () => {
      service.updateConfig({ frameRate: 24 });
      expect(service.getState().config.fps).toBe(24);
    });
  });

  describe('subscribe', () => {
    it('notifies listeners on state change', () => {
      const listener = vi.fn();
      service.subscribe(listener);
      
      service.updateConfig({ fps: 60 });
      
      expect(listener).toHaveBeenCalled();
    });

    it('returns unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribe(listener);
      
      // First update - listener called
      service.updateConfig({ fps: 60 });
      const callCount = listener.mock.calls.length;
      
      unsubscribe();
      
      // Second update - listener should not be called again
      service.updateConfig({ fps: 30 });
      expect(listener).toHaveBeenCalledTimes(callCount);
    });

    it('handles multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      service.subscribe(listener1);
      service.subscribe(listener2);
      
      service.updateConfig({ fps: 60 });
      
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('dispose', () => {
    it('can be called multiple times', () => {
      service.dispose();
      expect(() => service.dispose()).not.toThrow();
    });
  });

  describe('deprecated methods', () => {
    it('openPopOutWindow returns null with warning', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = service.openPopOutWindow();
      
      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('closePopOutWindow logs warning', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      service.closePopOutWindow();
      
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('startWebRTCStream returns URL and sets state', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const url = service.startWebRTCStream();
      
      expect(url).toContain('ws://localhost:8080/stream/');
      expect(service.getState().isStreaming).toBe(true);
      warnSpy.mockRestore();
    });

    it('stopWebRTCStream clears streaming state', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      service.startWebRTCStream();
      service.stopWebRTCStream();
      
      expect(service.getState().isStreaming).toBe(false);
      expect(service.getState().webrtcUrl).toBeUndefined();
      warnSpy.mockRestore();
    });

    it('sendFrame logs warning', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await service.sendFrame();
      
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('getSetupInstructions', () => {
    it('returns Zoom instructions', () => {
      const instructions = VirtualCameraService.getSetupInstructions('zoom');
      expect(instructions).toContain('Zoom');
    });

    it('returns Meet instructions', () => {
      const instructions = VirtualCameraService.getSetupInstructions('meet');
      expect(instructions).toContain('Google Meet');
    });

    it('returns Teams instructions', () => {
      const instructions = VirtualCameraService.getSetupInstructions('teams');
      expect(instructions).toContain('Microsoft Teams');
    });

    it('returns OBS instructions', () => {
      const instructions = VirtualCameraService.getSetupInstructions('obs');
      expect(instructions).toContain('OBS');
    });

    it('returns Discord instructions', () => {
      const instructions = VirtualCameraService.getSetupInstructions('discord');
      expect(instructions).toContain('Discord');
    });

    it('returns default for unknown app', () => {
      const instructions = VirtualCameraService.getSetupInstructions('unknown' as any);
      expect(instructions).toContain('Lumia Virtual Camera');
    });
  });

  describe('getState', () => {
    it('returns copy of state', () => {
      const state1 = service.getState();
      const state2 = service.getState();
      
      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });

    it('includes all state properties', () => {
      const state = service.getState();
      
      expect(state).toHaveProperty('isActive');
      expect(state).toHaveProperty('isWindowOpen');
      expect(state).toHaveProperty('stream');
      expect(state).toHaveProperty('config');
      expect(state).toHaveProperty('isStreaming');
      expect(state).toHaveProperty('capabilities');
    });
  });

  describe('isSupported', () => {
    it('returns boolean', () => {
      expect(typeof service.isSupported()).toBe('boolean');
    });
  });
});
