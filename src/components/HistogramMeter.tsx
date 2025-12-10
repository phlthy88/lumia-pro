import React, { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  width?: number;
  height?: number;
}

// Lightweight RGB histogram for the Meters tab
export const HistogramMeter: React.FC<Props> = ({ videoRef, enabled, width = 360, height = 180 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled || !videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!sampleCanvasRef.current) {
      sampleCanvasRef.current = document.createElement('canvas');
      sampleCanvasRef.current.width = 96;
      sampleCanvasRef.current.height = 54;
    }
    const sampleCanvas = sampleCanvasRef.current;
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
    if (!sampleCtx) return;

    const bins = 64;
    let rafId: number;
    let lastRender = 0;

    const draw = () => {
      const now = performance.now();
      if (now - lastRender < 120) {
        rafId = requestAnimationFrame(draw);
        return;
      }
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        rafId = requestAnimationFrame(draw);
        return;
      }
      lastRender = now;

      sampleCtx.drawImage(video, 0, 0, sampleCanvas.width, sampleCanvas.height);
      const data = sampleCtx.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;

      const rHist = new Array(bins).fill(0);
      const gHist = new Array(bins).fill(0);
      const bHist = new Array(bins).fill(0);

      for (let i = 0; i < data.length; i += 4) {
        rHist[(data[i] * bins) >> 8] += 1;
        gHist[(data[i + 1] * bins) >> 8] += 1;
        bHist[(data[i + 2] * bins) >> 8] += 1;
      }

      const maxCount = Math.max(
        Math.max(...rHist),
        Math.max(...gHist),
        Math.max(...bHist),
        1
      );

      ctx.fillStyle = '#0b0b0f';
      ctx.fillRect(0, 0, width, height);

      // grid
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const x = (i / 4) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let i = 0; i <= 4; i++) {
        const y = (i / 4) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const drawLine = (values: number[], color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        values.forEach((v, i) => {
        const x = (i / (bins - 1)) * width;
        const y = height - (v / maxCount) * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

      drawLine(rHist, 'rgba(255,64,64,0.9)');
      drawLine(gHist, 'rgba(64,255,128,0.9)');
      drawLine(bHist, 'rgba(64,160,255,0.9)');

      rafId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafId);
  }, [enabled, videoRef, width, height]);

  if (!enabled) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Typography variant="caption" color="text.secondary">Histogram</Typography>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width: '100%', maxWidth: width, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}
      />
    </Box>
  );
};
