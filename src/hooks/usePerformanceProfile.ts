import { useState, useEffect, useRef } from 'react';

export interface PerformanceMetrics {
    fps: number;
    memoryMB: number;
    droppedFrameCount: number;
    isLowPerformance: boolean;
}

export const usePerformanceProfile = () => {
    const [metrics, setMetrics] = useState<PerformanceMetrics>({
        fps: 60,
        memoryMB: 0,
        droppedFrameCount: 0,
        isLowPerformance: false
    });

    const frameCountRef = useRef(0);
    const lastTimeRef = useRef(performance.now());
    const lowFpsCountRef = useRef(0); // Consecutive seconds of low FPS

    useEffect(() => {
        let frameId: number;
        let isMounted = true;

        const loop = (now: number) => {
            if (!isMounted) return;

            frameCountRef.current++;
            const delta = now - lastTimeRef.current;

            if (delta >= 1000) {
                const fps = Math.round((frameCountRef.current * 1000) / delta);

                // Memory Check (Chrome only, guarded)
                let memoryMB = 0;
                if ('memory' in performance) {
                    // @ts-ignore
                    const mem = performance.memory;
                    if (mem && mem.usedJSHeapSize) {
                        memoryMB = Math.round(mem.usedJSHeapSize / 1024 / 1024);
                    }
                }

                // Low Performance Logic
                if (fps < 24) {
                    lowFpsCountRef.current++;
                } else {
                    lowFpsCountRef.current = 0;
                }

                setMetrics(prev => ({
                    fps,
                    memoryMB,
                    droppedFrameCount: prev.droppedFrameCount + Math.max(0, 60 - fps), // Approx
                    isLowPerformance: lowFpsCountRef.current >= 3 || memoryMB > 500
                }));

                frameCountRef.current = 0;
                lastTimeRef.current = now;
            }

            frameId = requestAnimationFrame(loop);
        };

        frameId = requestAnimationFrame(loop);

        return () => {
            isMounted = false;
            cancelAnimationFrame(frameId);
        };
    }, []);

    return metrics;
};
