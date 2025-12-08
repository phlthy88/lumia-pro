import { useRef, useState, useEffect, MutableRefObject, useCallback } from 'react';
import { GLRenderer } from '../engine/GLRenderer';
import { ColorGradeParams, TransformParams, RenderMode, EngineStats, LutData } from '../types';

interface GLParams {
    color: ColorGradeParams;
    transform: TransformParams;
    mode: RenderMode;
    gyroAngle: number;
    bypass: boolean;
}

export const useGLRenderer = (
    videoRef: MutableRefObject<HTMLVideoElement | null>,
    streamReady: boolean,
    paramsSource: MutableRefObject<GLParams> | (() => GLParams),
    onDrawOverlay?: (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => boolean,
    performanceMode: boolean = false
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GLRenderer | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastValidSizeRef = useRef<{w: number, h: number}>({w: 1920, h: 1080});
  
  const statsRef = useRef<EngineStats>({ 
      fps: 0, 
      frameTime: 0, 
      droppedFrames: 0, 
      resolution: 'Initializing...' 
  });

  const [contextLost, setContextLost] = useState(false);
  
  const drawCallbackRef = useRef(onDrawOverlay);
  useEffect(() => {
      drawCallbackRef.current = onDrawOverlay;
  }, [onDrawOverlay]);

  // Store streamReady in ref for context restore
  const streamReadyRef = useRef(streamReady);
  useEffect(() => {
      streamReadyRef.current = streamReady;
  }, [streamReady]);

  // Store paramsSource in ref
  const paramsSourceRef = useRef(paramsSource);
  useEffect(() => {
      paramsSourceRef.current = paramsSource;
  }, [paramsSource]);

  // Helper to start renderer
  const startRenderer = useCallback(() => {
    const renderer = rendererRef.current;
    if (!renderer || !streamReadyRef.current || !videoRef.current || !overlayCanvasRef.current) return;
    
    renderer.setVideoSource(videoRef.current);
    renderer.setOverlaySource(overlayCanvasRef.current);
    renderer.start(
      () => {
        const src = paramsSourceRef.current;
        if (typeof src === 'function') return src();
        return src.current;
      },
      (fps) => {
        if (videoRef.current) {
          statsRef.current = { 
            fps, 
            frameTime: 1000/Math.max(fps, 1), 
            droppedFrames: 0,
            resolution: `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}` 
          };
        }
      },
      (ctx, w, h, time) => {
        // Skip resize logic if canvas hidden (w or h is 0)
        if (w > 0 && h > 0) {
          lastValidSizeRef.current = {w, h};
        }
        if (drawCallbackRef.current) {
          return drawCallbackRef.current(ctx, w, h, time);
        }
        return false;
      }
    );
  }, [videoRef]);

  // Handle Context Loss/Restoration
  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const handleContextLost = (event: Event) => {
          event.preventDefault();
          console.warn("WebGL Context Lost");
          setContextLost(true);
          if (rendererRef.current) {
              rendererRef.current.stop();
              rendererRef.current = null;
          }
      };

      const handleContextRestored = () => {
          console.log("WebGL Context Restored");
          setContextLost(false);
          // Recreate renderer and restart
          if (canvasRef.current) {
            try {
              rendererRef.current = new GLRenderer(canvasRef.current);
              rendererRef.current.setPerformanceMode(performanceMode);
              startRenderer();
            } catch (e) {
              console.error("Failed to restore GLRenderer", e);
            }
          }
      };

      canvas.addEventListener('webglcontextlost', handleContextLost);
      canvas.addEventListener('webglcontextrestored', handleContextRestored);

      return () => {
          canvas.removeEventListener('webglcontextlost', handleContextLost);
          canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      };
  }, [performanceMode, startRenderer]);

  // Create overlay canvas once
  useEffect(() => {
    if (!overlayCanvasRef.current) {
        overlayCanvasRef.current = document.createElement('canvas');
    }
    return () => {
        overlayCanvasRef.current = null;
    }
  }, []);

  // Sync Performance Mode
  useEffect(() => {
      if (rendererRef.current) {
          rendererRef.current.setPerformanceMode(performanceMode);
      }
  }, [performanceMode]);

  useEffect(() => {
    if (contextLost) return;

    if (canvasRef.current && !rendererRef.current) {
      try {
        rendererRef.current = new GLRenderer(canvasRef.current);
        rendererRef.current.setPerformanceMode(performanceMode);
      } catch (e) {
          console.error("Failed to init GLRenderer", e);
      }
    }

    if (streamReady) {
      startRenderer();
    }

    return () => {
       rendererRef.current?.stop();
    };
  }, [streamReady, contextLost, startRenderer, performanceMode]);

  // Global cleanup
  useEffect(() => {
      return () => {
          rendererRef.current?.dispose();
          rendererRef.current = null;
      };
  }, []);

  const setLut = useCallback((lut: LutData) => {
      if (rendererRef.current) {
          rendererRef.current.setLut(lut);
      }
  }, []);

  return { canvasRef, statsRef, setLut };
};