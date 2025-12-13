import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRecorder } from '../useRecorder';
import { mediaStorage } from '../../services/MediaStorageService';

// Mock dependencies
const mockCleanupAudio = vi.fn();
const mockProcessStream = vi.fn((stream) => stream);

vi.mock('../useAudioProcessor', () => ({
  useAudioProcessor: () => ({
    processStream: mockProcessStream,
    cleanup: mockCleanupAudio,
  }),
}));

vi.mock('../../services/MediaStorageService', () => ({
  mediaStorage: {
    listMetadata: vi.fn().mockResolvedValue([]),
    getBlob: vi.fn().mockResolvedValue(new Blob()),
    saveBlob: vi.fn().mockResolvedValue(undefined),
    deleteBlob: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    getTotalSize: vi.fn().mockResolvedValue(0),
  },
  MediaItemMetadata: {},
}));

vi.mock('../../utils/CSPUtils', () => ({
  getCSPSafeBlobURL: vi.fn((blob) => Promise.resolve('blob:safe-url')),
  revokeCSPAwareBlobURL: vi.fn(),
}));

describe('Recording Workflow Integration', () => {
  let canvasRef: React.RefObject<HTMLCanvasElement>;

  // Spies
  let startSpy: any;
  let stopSpy: any;
  let pauseSpy: any;
  let resumeSpy: any;
  let activeRecorderInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Canvas with WebGL2 context that includes finish()
    const mockContext = {
      drawImage: vi.fn(),
      finish: vi.fn(), // Required by useRecorder captureFrame
    };

    const mockCanvas = {
      captureStream: vi.fn().mockReturnValue(new MediaStream()),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,test'),
      toBlob: vi.fn((cb: (blob: Blob) => void) => cb(new Blob(['test'], { type: 'image/png' }))),
      getContext: vi.fn().mockReturnValue(mockContext),
      width: 1920,
      height: 1080,
    };
    canvasRef = { current: mockCanvas as unknown as HTMLCanvasElement };

    // Initialize Spies
    startSpy = vi.fn(function(this: any) { this.state = 'recording'; });
    stopSpy = vi.fn(function(this: any) {
      this.state = 'inactive';
      if (this.onstop) this.onstop();
    });
    pauseSpy = vi.fn();
    resumeSpy = vi.fn();

    // Use a class to mock MediaRecorder
    class MockMediaRecorder {
      state = 'inactive';
      mimeType = 'video/webm';
      ondataavailable = null;
      onstop = null;
      onerror = null;

      constructor(stream: any, options: any) {
        // Bind spies to this instance
        this.start = startSpy.bind(this);
        this.stop = stopSpy.bind(this);
        this.pause = pauseSpy;
        this.resume = resumeSpy;

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const instance = this;
        activeRecorderInstance = instance;
      }

      // Methods placeholders to satisfy type checker (actual logic is in bound spies)
      start(timeslice?: number) {}
      stop() {}
      pause() {}
      resume() {}

      static isTypeSupported = vi.fn().mockReturnValue(true);
    }

    global.MediaRecorder = MockMediaRecorder as unknown as typeof MediaRecorder;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should record video, process data, and save blob', async () => {
    const { result } = renderHook(() => useRecorder(canvasRef, 30));

    // 1. Start Recording
    await act(async () => {
      await result.current.startRecording();
    });

    // Verify state
    expect(result.current.isRecording).toBe(true);
    expect(startSpy).toHaveBeenCalledWith(100);

    // 2. Simulate Data Available (Recorder emits chunks)
    const chunk1 = new Blob(['chunk1'], { type: 'video/webm' });
    const chunk2 = new Blob(['chunk2'], { type: 'video/webm' });

    act(() => {
      if (activeRecorderInstance && activeRecorderInstance.ondataavailable) {
        activeRecorderInstance.ondataavailable({ data: chunk1 });
        activeRecorderInstance.ondataavailable({ data: chunk2 });
      }
    });

    // 3. Stop Recording
    await act(async () => {
      result.current.stopRecording();
    });

    // Verify state
    expect(result.current.isRecording).toBe(false);
    expect(stopSpy).toHaveBeenCalled();

    // 4. Verify Media Item Created
    expect(result.current.mediaItems.length).toBe(1);
    const item = result.current.mediaItems[0];

    expect(item!.type).toBe('video');
    expect(item!.url).toBeDefined();

    // 5. Verify Save Service Called
    const calls = vi.mocked(mediaStorage.saveBlob).mock.calls;
    const saveCall = calls[0];

    expect(saveCall).toBeDefined();
    if (saveCall) {
      const [_id, blob] = saveCall;
      expect(blob.type).toBe('video/webm');
      expect(blob.size).toBeGreaterThan(0);
    }
  });

  it('should handle recording errors gracefully', async () => {
    const { result } = renderHook(() => useRecorder(canvasRef, 30));

    await act(async () => {
      await result.current.startRecording();
    });

    // Simulate Error
    act(() => {
      if (activeRecorderInstance && activeRecorderInstance.onerror) {
        activeRecorderInstance.onerror(new Event('error'));
      }
    });

    expect(result.current.isRecording).toBe(false);
    expect(result.current.error).toBeTruthy();
  });
});
