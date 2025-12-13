import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * @fileoverview A hook for orchestrating image capture from a canvas,
 * including countdowns and burst mode.
 */

export interface UseCaptureOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onCapture: (blob: Blob) => void;
  shutter?: () => void;
}

export interface UseCaptureReturn {
  countdown: number;
  isBursting: boolean;
  takeScreenshot: () => void;
  startCountdown: (seconds: number) => void;
  startBurst: (count: number, delayMs?: number) => Promise<void>;
}

export const useCapture = (options: UseCaptureOptions): UseCaptureReturn => {
  const { canvasRef, onCapture, shutter } = options;
  const [countdown, setCountdown] = useState(0);
  const [isBursting, setIsBursting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const takeScreenshot = useCallback(() => {
    if (!canvasRef.current) {
      console.warn('Capture failed: canvasRef is not set.');
      return;
    }
    canvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          shutter?.();
          onCapture(blob);
        }
      },
      'image/jpeg',
      0.95
    );
  }, [canvasRef, onCapture, shutter]);

  const startCountdown = (seconds: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCountdown(seconds);

    let remaining = seconds;
    const tick = () => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        takeScreenshot();
      } else {
        timerRef.current = setTimeout(tick, 1000);
      }
    };

    if (seconds > 0) {
      timerRef.current = setTimeout(tick, 1000);
    } else {
      takeScreenshot();
    }
  };

  const startBurst = async (count: number, delayMs = 100) => {
    if (isBursting) return;
    setIsBursting(true);

    for (let i = 0; i < count; i++) {
      takeScreenshot();
      if (i < count -1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    setIsBursting(false);
  };
  
  useEffect(() => {
    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { countdown, isBursting, takeScreenshot, startCountdown, startBurst };
};