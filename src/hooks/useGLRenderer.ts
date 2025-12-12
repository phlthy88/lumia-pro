import { useRef, useState, useEffect, MutableRefObject, useCallback } from 'react';
import { GLRenderer } from '../engine/GLRenderer';
import { ColorGradeParams, TransformParams, RenderMode, EngineStats, LutData, FallbackMode } from '../types';

interface GLParams {
    color: ColorGradeParams;
    transform: TransformParams;
    mode: RenderMode;
    gyroAngle: number;
    bypass: boolean;
    beauty?: {
        smoothStrength: number;
    };
}

export const useGLRenderer = (
    videoRef: MutableRefObject<HTMLVideoElement | null>,
    streamReady: boolean,
    paramsSource: MutableRefObject<GLParams> | (() => GLParams),
    onDrawOverlay?: (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => boolean,
    performanceMode: boolean = false
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasMounted, setCanvasMounted] = useState(false);
  const rendererRef = useRef<GLRenderer | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const lastValidSizeRef = useRef<{w: number, h: number}>({w: 1920, h: 1080});
  
  const statsRef = useRef<EngineStats>({ 
      fps: 0, 
      frameTime: 0, 
      droppedFrames: 0, 
      resolution: 'Initializing...' 
  });

  const [contextLost, setContextLost] = useState(false);
  const [error, setError] = useState<FallbackMode | null>(null);
  
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
    const video = videoRef.current;
    
    if (!renderer || !streamReadyRef.current || !video) return;
    
    renderer.setVideoSource(video);
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
              // Fallback if restore fails
               setError(FallbackMode.GENERIC_ERROR);
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

  // Sync Performance Mode
  useEffect(() => {
      if (rendererRef.current) {
          rendererRef.current.setPerformanceMode(performanceMode);
      }
  }, [performanceMode]);

  useEffect(() => {
    if (contextLost || !canvasMounted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!rendererRef.current) {
        // Initial Check for WebGL 2 Support
        const gl = canvas.getContext('webgl2');
        if (!gl) {
            console.error("WebGL 2.0 not supported");
            setError(FallbackMode.GL_UNSUPPORTED);
            return;
        }

      try {
        rendererRef.current = new GLRenderer(canvas);
        rendererRef.current.setPerformanceMode(performanceMode);
        console.log('[useGLRenderer] Renderer created');
      } catch (e) {
          console.error("Failed to init GLRenderer", e);
          setError(FallbackMode.GENERIC_ERROR);
      }
    }

    if (streamReady && rendererRef.current) {
      startRenderer();
    }

    return () => {
       rendererRef.current?.stop();
    };
  }, [streamReady, contextLost, startRenderer, performanceMode, canvasMounted]);

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

  const setBeautyMask = useCallback((mask: OffscreenCanvas | HTMLCanvasElement | null) => {
      rendererRef.current?.setBeautyMask(mask);
  }, []);

  const setBeautyMask2 = useCallback((mask: OffscreenCanvas | HTMLCanvasElement | null) => {
      rendererRef.current?.setBeautyMask2(mask);
  }, []);

  const setSegmentationMask = useCallback((mask: OffscreenCanvas | HTMLCanvasElement | null) => {
      rendererRef.current?.setSegmentationMask(mask);
  }, []);

  // Callback ref to detect when canvas is mounted
  const setCanvasRef = useCallback((node: HTMLCanvasElement | null) => {
    if (node === canvasRef.current) return;
    (canvasRef as any).current = node;
    // Force re-render after ref is set
    setCanvasMounted(prev => {
      // Toggle to force effect re-run even if value is same
      if (node) return true;
      return false;
    });
  }, []);

  return { canvasRef, setCanvasRef, statsRef, setLut, setBeautyMask, setBeautyMask2, setSegmentationMask, error };
};
