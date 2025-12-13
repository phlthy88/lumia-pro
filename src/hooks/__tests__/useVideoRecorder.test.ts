import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useVideoRecorder } from '../useVideoRecorder';

describe('useVideoRecorder', () => {
  let mockCanvas: HTMLCanvasElement;
  let mockCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  let mockOnError: vi.Mock;
  let mockStream: MediaStream;
  let originalMediaRecorder: typeof MediaRecorder;
  let lastRecorderInstance: any;
  let isTypeSupportedMock: vi.Mock;

  beforeEach(() => {
    vi.useFakeTimers();
    mockOnError = vi.fn();
    lastRecorderInstance = null;

    // Mock stream
    mockStream = {
      addTrack: vi.fn(),
      getAudioTracks: vi.fn(() => []),
      getVideoTracks: vi.fn(() => [{ stop: vi.fn() }]),
      getTracks: vi.fn(() => []),
    } as unknown as MediaStream;

    mockCanvas = document.createElement('canvas');
    vi.spyOn(mockCanvas, 'captureStream').mockReturnValue(mockStream);
    mockCanvasRef = { current: mockCanvas };

    // Store original
    originalMediaRecorder = window.MediaRecorder;
    
    isTypeSupportedMock = vi.fn(() => true);

    // Create class-based mock
    class MockMediaRecorder {
      static isTypeSupported = isTypeSupportedMock;
      
      state = 'inactive';
      mimeType: string;
      ondataavailable: ((e: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      onerror: ((e: { error: Error }) => void) | null = null;
      
      start = vi.fn(() => { this.state = 'recording'; });
      stop = vi.fn(() => {
        this.state = 'inactive';
        setTimeout(() => this.onstop?.(), 0);
      });

      constructor(_stream: MediaStream, options?: { mimeType?: string }) {
        this.mimeType = options?.mimeType || 'video/webm';
        lastRecorderInstance = this; // eslint-disable-line @typescript-eslint/no-this-alias
      }
    }

    (window as any).MediaRecorder = MockMediaRecorder;
  });

  afterEach(() => {
    (window as any).MediaRecorder = originalMediaRecorder;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('returns initial state correctly', () => {
    const { result } = renderHook(() =>
      useVideoRecorder({ canvasRef: mockCanvasRef })
    );

    expect(result.current.isRecording).toBe(false);
    expect(result.current.duration).toBe(0);
  });

  it('startRecording sets isRecording to true', async () => {
    const { result } = renderHook(() =>
      useVideoRecorder({ canvasRef: mockCanvasRef })
    );

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(true);
    expect(lastRecorderInstance.start).toHaveBeenCalled();
  });

  it('stopRecording returns Blob and resets state', async () => {
    const { result } = renderHook(() =>
      useVideoRecorder({ canvasRef: mockCanvasRef })
    );

    await act(async () => {
      await result.current.startRecording();
    });

    // Override stop to emit data
    lastRecorderInstance.stop.mockImplementation(function(this: any) {
      this.state = 'inactive';
      setTimeout(() => {
        this.ondataavailable?.({ data: new Blob(['video'], { type: 'video/webm' }) });
        this.onstop?.();
      }, 0);
    });

    let blob: Blob | null = null;
    await act(async () => {
      const promise = result.current.stopRecording();
      vi.runAllTimers();
      blob = await promise;
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(result.current.isRecording).toBe(false);
    expect(result.current.duration).toBe(0);
  });

  it('updates duration while recording', async () => {
    const { result } = renderHook(() =>
      useVideoRecorder({ canvasRef: mockCanvasRef })
    );

    await act(async () => {
      await result.current.startRecording();
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.duration).toBeGreaterThan(0);
  });

  it('falls back to vp8 codec when vp9 not supported', async () => {
    isTypeSupportedMock.mockImplementation(
      (type: string) => type !== 'video/webm;codecs=vp9'
    );

    const { result } = renderHook(() =>
      useVideoRecorder({ canvasRef: mockCanvasRef })
    );

    await act(async () => {
      await result.current.startRecording();
    });

    expect(lastRecorderInstance.mimeType).toBe('video/webm;codecs=vp8');
  });

  it('falls back to basic webm when no codecs supported', async () => {
    isTypeSupportedMock.mockImplementation(
      (type: string) => type === 'video/webm'
    );

    const { result } = renderHook(() =>
      useVideoRecorder({ canvasRef: mockCanvasRef })
    );

    await act(async () => {
      await result.current.startRecording();
    });

    expect(lastRecorderInstance.mimeType).toBe('video/webm');
  });

  it('calls onError when no MIME type supported', async () => {
    isTypeSupportedMock.mockReturnValue(false);

    const { result } = renderHook(() =>
      useVideoRecorder({ canvasRef: mockCanvasRef, onError: mockOnError })
    );

    await act(async () => {
      await result.current.startRecording();
    });

    expect(mockOnError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('No supported MIME type') })
    );
    expect(result.current.isRecording).toBe(false);
  });

  it('calls onError when canvas ref is null', async () => {
    const nullCanvasRef = { current: null };

    const { result } = renderHook(() =>
      useVideoRecorder({ canvasRef: nullCanvasRef, onError: mockOnError })
    );

    await act(async () => {
      await result.current.startRecording();
    });

    expect(mockOnError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Canvas ref') })
    );
  });

  it('stopRecording returns null when not recording', async () => {
    const { result } = renderHook(() =>
      useVideoRecorder({ canvasRef: mockCanvasRef })
    );

    let blob: Blob | null;
    await act(async () => {
      blob = await result.current.stopRecording();
    });

    expect(blob!).toBeNull();
  });

  it('cleans up on unmount', async () => {
    const { result, unmount } = renderHook(() =>
      useVideoRecorder({ canvasRef: mockCanvasRef })
    );

    await act(async () => {
      await result.current.startRecording();
    });

    lastRecorderInstance.state = 'recording';
    unmount();

    expect(lastRecorderInstance.stop).toHaveBeenCalled();
  });
});
