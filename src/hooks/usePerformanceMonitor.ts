import { useEffect, useRef, useState, useCallback } from 'react';
import { ErrorReporter } from '../services/ErrorReporter';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number | null; // MB
  gpuMemory: number | null; // MB (if available)
  droppedFrames: number;
  longTasks: number;
}

interface PerformanceThresholds {
  minFps: number;
  maxFrameTime: number;
  maxMemory: number;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  minFps: 24,
  maxFrameTime: 50, // ms
  maxMemory: 1024, // MB
};

export const usePerformanceMonitor = (
  enabled = true,
  thresholds = DEFAULT_THRESHOLDS
) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameTime: 16.67,
    memoryUsage: null,
    gpuMemory: null,
    droppedFrames: 0,
    longTasks: 0,
  });

  const frameTimesRef = useRef<number[]>([]);
  const lastFrameRef = useRef(performance.now());
  const droppedFramesRef = useRef(0);
  const longTasksRef = useRef(0);
  const rafRef = useRef<number>(0);
  const [isVisible, setIsVisible] = useState(() =>
    typeof document === 'undefined' ? true : document.visibilityState === 'visible'
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibility = () => {
      setIsVisible(document.visibilityState === 'visible');
      // Reset frame baseline when returning to the page to avoid a giant delta
      if (document.visibilityState === 'visible') {
        lastFrameRef.current = performance.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Long task observer
  useEffect(() => {
    if (!enabled || !isVisible || typeof PerformanceObserver === 'undefined') return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            longTasksRef.current++;
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      return () => observer.disconnect();
    } catch {
      // Long task observer not supported
      return;
    }
  }, [enabled, isVisible]);

  // Frame timing loop
  useEffect(() => {
    if (!enabled || !isVisible) return;

    lastFrameRef.current = performance.now();
    const measureFrame = () => {
      const now = performance.now();
      const frameTime = now - lastFrameRef.current;
      lastFrameRef.current = now;

      // Track frame times (keep last 60)
      frameTimesRef.current.push(frameTime);
      if (frameTimesRef.current.length > 60) {
        frameTimesRef.current.shift();
      }

      // Detect dropped frames (>33ms = dropped at 30fps target)
      if (frameTime > 33) {
        droppedFramesRef.current++;
      }

      rafRef.current = requestAnimationFrame(measureFrame);
    };

    rafRef.current = requestAnimationFrame(measureFrame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [enabled, isVisible]);

  // Periodic metrics update
  useEffect(() => {
    if (!enabled || !isVisible) return;

    const updateMetrics = () => {
      const frameTimes = frameTimesRef.current;
      if (frameTimes.length === 0) return;

      const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      const fps = Math.round(1000 / avgFrameTime);

      // Memory usage (Chrome only)
      let memoryUsage: number | null = null;
      if ('memory' in performance) {
        const mem = (performance as any).memory;
        memoryUsage = Math.round(mem.usedJSHeapSize / 1024 / 1024);
      }

      const newMetrics: PerformanceMetrics = {
        fps,
        frameTime: Math.round(avgFrameTime * 100) / 100,
        memoryUsage,
        gpuMemory: null, // Would need WebGPU for this
        droppedFrames: droppedFramesRef.current,
        longTasks: longTasksRef.current,
      };

      setMetrics(newMetrics);

      // Report performance issues
      if (fps < thresholds.minFps) {
        ErrorReporter.captureMessage(
          `Low FPS detected: ${fps}`,
          'warning'
        );
      }

      if (memoryUsage && memoryUsage > thresholds.maxMemory) {
        ErrorReporter.captureMessage(
          `High memory usage: ${memoryUsage}MB`,
          'warning'
        );
      }
    };

    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  }, [enabled, thresholds, isVisible]);

  const resetCounters = useCallback(() => {
    droppedFramesRef.current = 0;
    longTasksRef.current = 0;
    frameTimesRef.current = [];
  }, []);

  // Report to analytics on unmount
  useEffect(() => {
    return () => {
      if (droppedFramesRef.current > 100 || longTasksRef.current > 50) {
        ErrorReporter.captureMessage(
          `Session performance: ${droppedFramesRef.current} dropped frames, ${longTasksRef.current} long tasks`,
          'info'
        );
      }
    };
  }, []);

  return {
    metrics,
    resetCounters,
    isHealthy: metrics.fps >= thresholds.minFps && 
               (metrics.memoryUsage === null || metrics.memoryUsage < thresholds.maxMemory),
  };
};
