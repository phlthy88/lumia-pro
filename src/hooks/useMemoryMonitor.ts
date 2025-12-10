import { useState, useEffect } from 'react';

// Extend the Performance interface to include the non-standard memory property
interface PerformanceMemory {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

interface ExtendedPerformance extends Performance {
  memory?: PerformanceMemory;
}

export const useMemoryMonitor = () => {
  const [usedJSHeapSize, setUsedJSHeapSize] = useState<number>(0);
  const [isLowMemory, setIsLowMemory] = useState<boolean>(false);
  const [lowMemoryMode, setLowMemoryMode] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState(() =>
    typeof document === 'undefined' ? true : document.visibilityState === 'visible'
  );

  // 500MB threshold
  const MEMORY_THRESHOLD = 500 * 1024 * 1024;

  useEffect(() => {
    const perf = performance as ExtendedPerformance;
    if (!perf.memory) return;
    if (typeof document === 'undefined') return;

    let intervalId: number | null = null;
    const stopPolling = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const checkMemory = () => {
      if (!perf.memory) return;

      const used = perf.memory.usedJSHeapSize;
      setUsedJSHeapSize(used);

      if (used > MEMORY_THRESHOLD) {
        console.warn(`[MemoryMonitor] High memory usage: ${(used / 1024 / 1024).toFixed(2)} MB`);
        setIsLowMemory(true);
      } else {
        setIsLowMemory(false);
      }
    };

    const startPolling = () => {
      if (intervalId !== null || !isVisible) return;

      checkMemory();
      intervalId = window.setInterval(checkMemory, 10000);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stopPolling();
      } else {
        startPolling();
      }
      setIsVisible(document.visibilityState === 'visible');
    };

    // Initial check
    startPolling();

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isVisible]);

  return {
    usedJSHeapSize,
    isLowMemory,
    lowMemoryMode,
    setLowMemoryMode
  };
};
