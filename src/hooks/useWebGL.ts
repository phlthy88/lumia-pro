import { useRef, useState, useEffect, useCallback } from 'react';
import { GLRenderer } from '../engine/GLRenderer';
import { ColorGradeParams, TransformParams, RenderMode } from '../types';

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
    lift: 0,
    gamma: 1,
    gain: 1,
    highlightRoll: 0,
    shadowRoll: 0,
    vignette: 0,
    grain: 0,
    lutStrength: 1,
    sharpness: 0,
    distortion: 0,
    denoise: 0,
    portraitLight: 0,
    highlights: 0,
    shadows: 0,
    blacks: 0,
    skinSmoothing: 0
  });

  const [transformParams] = useState<TransformParams>({
    zoom: 1,
    rotate: 0,
    panX: 0,
    panY: 0,
    flipX: false,
    flipY: false
  });

  const initRenderer = useCallback(async () => {
    if (!canvasRef.current || !videoStream) return;

    try {
      const renderer = new GLRenderer(canvasRef.current);
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

  const updateColorGrading = useCallback((params: Partial<ColorGradeParams>) => {
    setColorParams(prev => ({ ...prev, ...params }));
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

  // Start rendering loop
  useEffect(() => {
    if (!state.isReady || !rendererRef.current) return;

    const getParams = () => ({
      color: colorParams,
      transform: transformParams,
      mode: RenderMode.Standard,
      gyroAngle: 0,
      bypass: false
    });

    const onStats = (fps: number) => {
      setState(prev => ({ ...prev, fps }));
    };

    const onDrawOverlay = () => false;

    rendererRef.current.start(getParams, onStats, onDrawOverlay);

    return () => {
      if (rendererRef.current) {
        rendererRef.current.stop();
      }
    };
  }, [state.isReady, colorParams, transformParams]);

  return {
    canvasRef,
    isReady: state.isReady,
    error: state.error,
    fps: state.fps,
    colorParams,
    updateColorGrading,
    captureFrame
  };
};
