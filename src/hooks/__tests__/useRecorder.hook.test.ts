import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRecorder } from '../useRecorder';

// Mock MediaRecorder
const mockMediaRecorder = {
  start: vi.fn(),
  stop: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  ondataavailable: null as ((e: { data: Blob }) => void) | null,
  onstop: null as (() => void) | null,
  state: 'inactive' as RecordingState,
};

vi.mock('../useAudioProcessor', () => ({
  useAudioProcessor: () => ({
    processStream: vi.fn().mockResolvedValue(new MediaStream()),
    cleanup: vi.fn(),
  }),
}));

vi.mock('../../services/MediaStorageService', () => ({
  saveMedia: vi.fn().mockResolvedValue('test-id'),
  loadMediaMetadata: vi.fn().mockResolvedValue([]),
  loadMediaBlob: vi.fn().mockResolvedValue(new Blob()),
  deleteMediaItem: vi.fn().mockResolvedValue(undefined),
  clearAllMedia: vi.fn().mockResolvedValue(undefined),
}));

describe('useRecorder hook', () => {
  let canvasRef: React.RefObject<HTMLCanvasElement>;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock canvas
    const mockCanvas = {
      captureStream: vi.fn().mockReturnValue(new MediaStream()),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,test'),
      toBlob: vi.fn((cb: (blob: Blob) => void) => cb(new Blob(['test'], { type: 'image/png' }))),
      getContext: vi.fn().mockReturnValue({
        drawImage: vi.fn(),
        finish: vi.fn(),
      }),
      width: 1920,
      height: 1080,
    };
    canvasRef = { current: mockCanvas as unknown as HTMLCanvasElement };

    // Mock MediaRecorder constructor
    global.MediaRecorder = vi.fn().mockImplementation(() => ({
      ...mockMediaRecorder,
      start: vi.fn(),
      stop: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
    })) as unknown as typeof MediaRecorder;
    
    (global.MediaRecorder as unknown as { isTypeSupported: (type: string) => boolean }).isTypeSupported = vi.fn().mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useRecorder(canvasRef, 30));

    expect(result.current.isRecording).toBe(false);
    expect(result.current.recordingTime).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('exposes recording control functions', () => {
    const { result } = renderHook(() => useRecorder(canvasRef, 30));

    expect(typeof result.current.startRecording).toBe('function');
    expect(typeof result.current.stopRecording).toBe('function');
    expect(typeof result.current.takeScreenshot).toBe('function');
  });

  it('exposes media items array', () => {
    const { result } = renderHook(() => useRecorder(canvasRef, 30));

    expect(Array.isArray(result.current.mediaItems)).toBe(true);
  });

  it('uses provided targetFPS', () => {
    const { result } = renderHook(() => useRecorder(canvasRef, 60));
    
    // Hook should initialize without error with custom FPS
    expect(result.current.error).toBeNull();
  });


});

describe('useRecorder snapshot', () => {
  let canvasRef: React.RefObject<HTMLCanvasElement>;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    const mockCanvas = {
      captureStream: vi.fn().mockReturnValue(new MediaStream()),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,test'),
      toBlob: vi.fn((cb: (blob: Blob) => void) => cb(new Blob(['test'], { type: 'image/png' }))),
      getContext: vi.fn().mockReturnValue({ drawImage: vi.fn(), finish: vi.fn() }),
      width: 1920,
      height: 1080,
    };
    canvasRef = { current: mockCanvas as unknown as HTMLCanvasElement };
  });

  it('takeScreenshot returns without error when canvas exists', async () => {
    const { result } = renderHook(() => useRecorder(canvasRef, 30));

    // Should not throw
    act(() => {
      result.current.takeScreenshot();
    });
  });
});
