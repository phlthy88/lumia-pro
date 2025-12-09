import { useState, useEffect, useRef } from 'react';

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

  // 500MB threshold
  const MEMORY_THRESHOLD = 500 * 1024 * 1024;

  useEffect(() => {
    const perf = performance as ExtendedPerformance;
    if (!perf.memory) return;

    const checkMemory = () => {
      if (perf.memory) {
        const used = perf.memory.usedJSHeapSize;
        setUsedJSHeapSize(used);

        if (used > MEMORY_THRESHOLD) {
          console.warn(`[MemoryMonitor] High memory usage: ${(used / 1024 / 1024).toFixed(2)} MB`);
          setIsLowMemory(true);
        } else {
          setIsLowMemory(false);
        }
      }
    };

    // Initial check
    checkMemory();

    const intervalId = setInterval(checkMemory, 10000); // 10s poll

    return () => clearInterval(intervalId);
  }, []);

  return {
    usedJSHeapSize,
    isLowMemory,
    lowMemoryMode,
    setLowMemoryMode
  };
};
