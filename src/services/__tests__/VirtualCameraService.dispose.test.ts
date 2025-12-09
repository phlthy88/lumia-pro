import { describe, it, expect, vi } from 'vitest';

describe('VirtualCameraService disposal', () => {
  it('is safe to call dispose multiple times', async () => {
    // Mock captureStream
    HTMLCanvasElement.prototype.captureStream = vi.fn(() => ({
      getTracks: () => [{ stop: vi.fn(), kind: 'video' }],
      getVideoTracks: () => [{ stop: vi.fn(), kind: 'video' }],
      getAudioTracks: () => [],
    } as unknown as MediaStream));

    const { VirtualCameraService } = await import('../VirtualCameraService');
    const service = new VirtualCameraService();
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = 1920;
    mockCanvas.height = 1080;

    service.initialize(mockCanvas);

    expect(() => {
      service.dispose();
      service.dispose();
    }).not.toThrow();
  });

  it('resets state after dispose', async () => {
    HTMLCanvasElement.prototype.captureStream = vi.fn(() => ({
      getTracks: () => [{ stop: vi.fn(), kind: 'video' }],
      getVideoTracks: () => [{ stop: vi.fn(), kind: 'video' }],
      getAudioTracks: () => [],
    } as unknown as MediaStream));

    const { VirtualCameraService } = await import('../VirtualCameraService');
    const service = new VirtualCameraService();
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = 1920;
    mockCanvas.height = 1080;

    service.initialize(mockCanvas);
    service.start();
    service.dispose();

    const state = service.getState();
    expect(state.isActive).toBe(false);
  });
});
