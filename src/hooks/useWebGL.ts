import { useRef, useState, useEffect, useCallback } from 'react';
import { GLRenderer } from '../engine/GLRenderer';
import { ColorGradeParams } from '../types';

interface WebGLState {
  isReady: boolean;
  error: string | null;
  fps: number;
}

export const useWebGL = (videoStream: MediaStream | null) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GLRenderer | null>(null);
  const [state, setState] = useState<WebGLState>({
    isReady: false,
    error: null,
    fps: 0
  });

  const [colorParams, setColorParams] = useState<ColorGradeParams>({
    exposure: 0,
    contrast: 1,
    saturation: 1,
    temperature: 0,
    tint: 0,
    highlights: 0,
    shadows: 0,
    whites: 0,
    blacks: 0,
    clarity: 0,
    vibrance: 0,
    lutIntensity: 1,
    selectedLut: null
  });

  const initRenderer = useCallback(async () => {
    if (!canvasRef.current || !videoStream) return;

    try {
      const renderer = new GLRenderer(canvasRef.current);
      await renderer.initialize();
      rendererRef.current = renderer;
      
      setState(prev => ({ ...prev, isReady: true, error: null }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to initialize WebGL renderer',
        isReady: false 
      }));
    }
  }, [videoStream]);

  const render = useCallback(() => {
    if (!rendererRef.current || !videoStream) return;

    try {
      rendererRef.current.render(colorParams);
      
      // Update FPS
      const now = performance.now();
      setState(prev => ({ ...prev, fps: Math.round(1000 / (now - (prev as any).lastFrame || 16)) }));
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Render error' }));
    }
  }, [colorParams, videoStream]);

  const updateColorGrading = useCallback((params: Partial<ColorGradeParams>) => {
    setColorParams(prev => ({ ...prev, ...params }));
  }, []);

  const loadLUT = useCallback(async (lutPath: string) => {
    if (!rendererRef.current) return;
    
    try {
      await rendererRef.current.loadLUT(lutPath);
      setColorParams(prev => ({ ...prev, selectedLut: lutPath }));
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to load LUT' }));
    }
  }, []);

  const captureFrame = useCallback((): string | null => {
    if (!canvasRef.current) return null;
    return canvasRef.current.toDataURL('image/png');
  }, []);

  useEffect(() => {
    if (videoStream) {
      initRenderer();
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, [videoStream, initRenderer]);

  // Animation loop
  useEffect(() => {
    if (!state.isReady) return;

    let animationId: number;
    const animate = () => {
      render();
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [state.isReady, render]);

  return {
    canvasRef,
    isReady: state.isReady,
    error: state.error,
    fps: state.fps,
    colorParams,
    updateColorGrading,
    loadLUT,
    captureFrame
  };
};
