import React, { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  width?: number;
  height?: number;
}

// Simple RGB parade waveform meter for the Meters tab
export const RGBParadeMeter: React.FC<Props> = ({ videoRef, enabled, width = 360, height = 180 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled || !videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!sampleCanvasRef.current) {
      sampleCanvasRef.current = document.createElement('canvas');
      sampleCanvasRef.current.width = 72;
      sampleCanvasRef.current.height = 40;
    }
    const sampleCanvas = sampleCanvasRef.current;
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
    if (!sampleCtx) return;

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

      ctx.fillStyle = '#0b0b0f';
      ctx.fillRect(0, 0, width, height);

      // grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      for (let i = 1; i <= 2; i++) {
        const x = (i / 3) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let i = 1; i < 4; i++) {
        const y = (i / 4) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const channelColors = ['rgba(255,80,80,0.85)', 'rgba(80,255,140,0.85)', 'rgba(80,160,255,0.85)'];
      const sectionWidth = width / 3;

      // Draw scatter waveform per channel
      for (let y = 0; y < sampleCanvas.height; y += 2) {
        for (let x = 0; x < sampleCanvas.width; x += 2) {
          const idx = (y * sampleCanvas.width + x) * 4;
          const r = data[idx] / 255;
          const g = data[idx + 1] / 255;
          const b = data[idx + 2] / 255;

          const values = [r, g, b];
          values.forEach((v, c) => {
            const px = x / sampleCanvas.width * sectionWidth + c * sectionWidth;
            const py = height - v * height;
            ctx.fillStyle = channelColors[c];
            ctx.fillRect(px, py, 1.5, 1.5);
          });
        }
      }

      rafId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafId);
  }, [enabled, videoRef, width, height]);

  if (!enabled) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Typography variant="caption" color="text.secondary">RGB Parade</Typography>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width: '100%', maxWidth: width, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}
      />
    </Box>
  );
};
