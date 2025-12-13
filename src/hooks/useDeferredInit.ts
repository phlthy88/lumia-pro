import { useState, useEffect } from 'react';

export const useDeferredInit = (delay = 100) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Use requestIdleCallback if available for smoother loading
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(() => setReady(true), { timeout: delay });
      return () => cancelIdleCallback(id);
    }
    const timer = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return ready;
};
