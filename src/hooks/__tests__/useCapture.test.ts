import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCapture } from '../useCapture';

describe('useCapture', () => {
  let mockCanvas: HTMLCanvasElement;
  let mockCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  let mockOnCapture: vi.Mock;
  let mockShutter: vi.Mock;
  let toBlobSpy: vi.SpiedFunction<HTMLCanvasElement['toBlob']>;

  beforeEach(() => {
    mockOnCapture = vi.fn();
    mockShutter = vi.fn();
    mockCanvas = document.createElement('canvas');
    toBlobSpy = vi.spyOn(mockCanvas, 'toBlob').mockImplementation((callback) => {
      if (callback) {
        const blob = new Blob(['test'], { type: 'image/jpeg' });
        callback(blob);
      }
    });
    mockCanvasRef = { current: mockCanvas };
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('takeScreenshot calls canvas.toBlob', () => {
    const { result } = renderHook(() =>
      useCapture({ canvasRef: mockCanvasRef, onCapture: mockOnCapture, shutter: mockShutter })
    );

    act(() => {
      result.current.takeScreenshot();
    });

    expect(toBlobSpy).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.95);
    expect(mockShutter).toHaveBeenCalledTimes(1);
    expect(mockOnCapture).toHaveBeenCalledTimes(1);
    expect(mockOnCapture).toHaveBeenCalledWith(expect.any(Blob));
  });

  it('takeScreenshot does nothing if canvasRef.current is null', () => {
    mockCanvasRef.current = null;
    const { result } = renderHook(() =>
      useCapture({ canvasRef: mockCanvasRef, onCapture: mockOnCapture, shutter: mockShutter })
    );

    act(() => {
      result.current.takeScreenshot();
    });

    expect(toBlobSpy).not.toHaveBeenCalled();
    expect(mockShutter).not.toHaveBeenCalled();
    expect(mockOnCapture).not.toHaveBeenCalled();
  });


  it('startCountdown decrements countdown state', () => {
    const { result } = renderHook(() =>
      useCapture({ canvasRef: mockCanvasRef, onCapture: mockOnCapture })
    );

    act(() => {
      result.current.startCountdown(3);
    });

    expect(result.current.countdown).toBe(3);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.countdown).toBe(2);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.countdown).toBe(1);
  });

  it('startCountdown calls onCapture at zero and cleans up timer', async () => {
    const { result } = renderHook(() =>
      useCapture({ canvasRef: mockCanvasRef, onCapture: mockOnCapture })
    );

    act(() => {
      result.current.startCountdown(1);
    });

    expect(result.current.countdown).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1000); // 1 -> 0
    });
    
    expect(result.current.countdown).toBe(0);
    expect(mockOnCapture).toHaveBeenCalledTimes(1);
  });

  it('startBurst takes multiple photos with delay', async () => {
    const { result } = renderHook(() =>
      useCapture({ canvasRef: mockCanvasRef, onCapture: mockOnCapture, shutter: mockShutter })
    );

    // Call startBurst
    act(() => {
      result.current.startBurst(3, 50);
    });
    
    // First photo is taken immediately
    expect(mockOnCapture).toHaveBeenCalledTimes(1);
    expect(result.current.isBursting).toBe(true);

    // Advance for second photo
    await act(async () => {
      vi.advanceTimersByTime(50);
    });
    expect(mockOnCapture).toHaveBeenCalledTimes(2);

    // Advance for third photo
    await act(async () => {
      vi.advanceTimersByTime(50);
    });
    expect(mockOnCapture).toHaveBeenCalledTimes(3);

    // Run any remaining timers to complete burst
    await act(async () => {
      vi.runAllTimers();
    });
    expect(result.current.isBursting).toBe(false);
    expect(mockShutter).toHaveBeenCalledTimes(3);
  });

  it('cleans up timers on unmount', async () => {
    const { result, unmount } = renderHook(() =>
      useCapture({ canvasRef: mockCanvasRef, onCapture: mockOnCapture })
    );

    act(() => {
      result.current.startCountdown(5);
    });

    expect(result.current.countdown).toBe(5);
    
    await act(async () => {
      unmount();
    });

    // After unmount, advancing timers should not cause further calls
    act(() => {
      vi.advanceTimersByTime(5000); 
    });

    expect(mockOnCapture).not.toHaveBeenCalled(); // No capture after unmount
  });
});