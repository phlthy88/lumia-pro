import { useState, useCallback, useRef } from 'react';
import { OverlayConfig, GridType, AspectRatio } from '../types';

export const useOverlays = () => {
  const [config, setConfig] = useState<OverlayConfig>({
    grid: GridType.None,
    aspectRatio: AspectRatio.Native,
    safeArea: false,
    timecode: false,
  });

  const prevConfigRef = useRef<string>('');
  const prevSizeRef = useRef<{w: number, h: number}>({ w: 0, h: 0 });
  
  // Animation state for smooth bar transitions (separate for H and V)
  const hBarRef = useRef<number>(0);
  const vBarRef = useRef<number>(0);
  
  const getTargetRatio = (ar: AspectRatio, nativeRatio: number): number => {
    switch (ar) {
      case AspectRatio.SixteenByNine: return 16/9;
      case AspectRatio.FourByThree: return 4/3;
      case AspectRatio.OneByOne: return 1.0;
      case AspectRatio.TwoThirtyFive: return 2.35;
      case AspectRatio.Vertical: return 9/16;
      default: return nativeRatio;
    }
  };

  const drawOverlays = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number): boolean => {
    const configStr = JSON.stringify(config);
    const sizeChanged = width !== prevSizeRef.current.w || height !== prevSizeRef.current.h;
    
    const nativeRatio = width / height;
    const targetRatio = getTargetRatio(config.aspectRatio, nativeRatio);
    
    // Calculate target bar sizes (both directions)
    let targetHBar = 0;
    let targetVBar = 0;
    
    if (config.aspectRatio !== AspectRatio.Native && config.aspectRatio !== AspectRatio.Free) {
      if (targetRatio > nativeRatio) {
        // Letterbox (horizontal bars)
        const drawH = width / targetRatio;
        targetHBar = (height - drawH) / 2;
      } else {
        // Pillarbox (vertical bars)
        const drawW = height * targetRatio;
        targetVBar = (width - drawW) / 2;
      }
    }
    
    // Smooth animation - lerp both bars independently with easing
    const lerpSpeed = 0.12;
    const hDiff = targetHBar - hBarRef.current;
    const vDiff = targetVBar - vBarRef.current;
    const isAnimating = Math.abs(hDiff) > 0.5 || Math.abs(vDiff) > 0.5;
    
    if (Math.abs(hDiff) > 0.5) {
      hBarRef.current += hDiff * lerpSpeed;
    } else {
      hBarRef.current = targetHBar;
    }
    
    if (Math.abs(vDiff) > 0.5) {
      vBarRef.current += vDiff * lerpSpeed;
    } else {
      vBarRef.current = targetVBar;
    }
    
    const currentHBar = hBarRef.current;
    const currentVBar = vBarRef.current;
    
    // Check if we need to redraw
    const isDirty = config.timecode || isAnimating || configStr !== prevConfigRef.current || sizeChanged;

    if (!isDirty) {
      return false;
    }

    prevConfigRef.current = configStr;
    prevSizeRef.current = { w: width, h: height };

    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;

    // Calculate view dimensions based on animated bars
    let viewW = width - currentVBar * 2;
    let viewH = height - currentHBar * 2;

    // Draw animated bars
    ctx.fillStyle = 'black';
    
    if (currentHBar > 0.5) {
      // Letterbox (top/bottom)
      ctx.fillRect(0, 0, width, currentHBar);
      ctx.fillRect(0, height - currentHBar, width, currentHBar);
    }
    
    if (currentVBar > 0.5) {
      // Pillarbox (left/right)
      ctx.fillRect(0, 0, currentVBar, height);
      ctx.fillRect(width - currentVBar, 0, currentVBar, height);
    }

    const offsetX = (width - viewW) / 2;
    const offsetY = (height - viewH) / 2;
    
    // Grids
    if (config.grid !== GridType.None) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();

      if (config.grid === GridType.RuleOfThirds) {
        const x1 = offsetX + viewW * 0.333;
        const x2 = offsetX + viewW * 0.666;
        const y1 = offsetY + viewH * 0.333;
        const y2 = offsetY + viewH * 0.666;
        ctx.moveTo(x1, offsetY); ctx.lineTo(x1, offsetY + viewH);
        ctx.moveTo(x2, offsetY); ctx.lineTo(x2, offsetY + viewH);
        ctx.moveTo(offsetX, y1); ctx.lineTo(offsetX + viewW, y1);
        ctx.moveTo(offsetX, y2); ctx.lineTo(offsetX + viewW, y2);
      } else if (config.grid === GridType.GoldenRatio) {
        const phi = 0.618;
        const invPhi = 1 - phi;
        const x1 = offsetX + viewW * invPhi;
        const x2 = offsetX + viewW * phi;
        const y1 = offsetY + viewH * invPhi;
        const y2 = offsetY + viewH * phi;
        ctx.moveTo(x1, offsetY); ctx.lineTo(x1, offsetY + viewH);
        ctx.moveTo(x2, offsetY); ctx.lineTo(x2, offsetY + viewH);
        ctx.moveTo(offsetX, y1); ctx.lineTo(offsetX + viewW, y1);
        ctx.moveTo(offsetX, y2); ctx.lineTo(offsetX + viewW, y2);
      } else if (config.grid === GridType.Crosshair) {
        ctx.moveTo(cx, offsetY); ctx.lineTo(cx, offsetY + viewH);
        ctx.moveTo(offsetX, cy); ctx.lineTo(offsetX + viewW, cy);
      }
      ctx.stroke();
    }

    // Safe Areas
    if (config.safeArea) {
      ctx.strokeStyle = 'rgba(100, 255, 100, 0.5)';
      ctx.setLineDash([4, 4]);
      const actionW = viewW * 0.9;
      const actionH = viewH * 0.9;
      ctx.strokeRect(cx - actionW/2, cy - actionH/2, actionW, actionH);
      
      ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)';
      const titleW = viewW * 0.8;
      const titleH = viewH * 0.8;
      ctx.strokeRect(cx - titleW/2, cy - titleH/2, titleW, titleH);
      ctx.setLineDash([]);
    }

    // Timecode
    if (config.timecode) {
      const date = new Date();
      const ms = date.getMilliseconds();
      const ff = Math.floor(ms / (1000/60));
      const timeStr = date.toTimeString().split(' ')[0] + ':' + ff.toString().padStart(2, '0');
      
      ctx.font = 'bold 24px monospace';
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      ctx.textAlign = 'right';
      ctx.strokeText(timeStr, width - 40, 60);
      ctx.fillText(timeStr, width - 40, 60);

      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(width - 25, height - 48, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    return true;
  }, [config]);

  return { config, setConfig, drawOverlays };
};
