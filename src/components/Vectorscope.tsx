import React, { useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  size?: number;
}

/**
 * Vectorscope - Shows color distribution on a circular graph
 * The "skin tone line" runs from center toward yellow-orange (~123°)
 */
export const Vectorscope: React.FC<Props> = ({ videoRef, enabled, size = 150 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled || !videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create sample canvas for downscaling
    if (!sampleCanvasRef.current) {
      sampleCanvasRef.current = document.createElement('canvas');
      sampleCanvasRef.current.width = 64;
      sampleCanvasRef.current.height = 36;
    }
    const sampleCanvas = sampleCanvasRef.current;
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
    if (!sampleCtx) return;

    let rafId: number;

    const draw = () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        rafId = requestAnimationFrame(draw);
        return;
      }

      // Sample video at low resolution
      sampleCtx.drawImage(video, 0, 0, 64, 36);
      const imageData = sampleCtx.getImageData(0, 0, 64, 36);
      const pixels = imageData.data;

      // Clear and draw background
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;
      const radius = size / 2 - 10;

      // Draw graticule
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.66, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.33, 0, Math.PI * 2);
      ctx.stroke();

      // Draw skin tone line (I-line, ~123° from positive B axis)
      ctx.strokeStyle = '#664422';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const skinAngle = (123 * Math.PI) / 180;
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(skinAngle) * radius, cy - Math.sin(skinAngle) * radius);
      ctx.stroke();

      // Draw color targets (R, G, B, C, M, Y)
      const targets = [
        { angle: 103, label: 'R', color: '#ff0000' },
        { angle: 241, label: 'G', color: '#00ff00' },
        { angle: 347, label: 'B', color: '#0000ff' },
        { angle: 283, label: 'C', color: '#00ffff' },
        { angle: 61, label: 'M', color: '#ff00ff' },
        { angle: 167, label: 'Y', color: '#ffff00' },
      ];
      ctx.font = '8px sans-serif';
      targets.forEach(({ angle, label, color }) => {
        const rad = (angle * Math.PI) / 180;
        const x = cx + Math.cos(rad) * radius * 0.85;
        const y = cy - Math.sin(rad) * radius * 0.85;
        ctx.fillStyle = color;
        ctx.fillText(label, x - 3, y + 3);
      });

      // Plot pixels
      ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
      for (let i = 0; i < pixels.length; i += 16) { // Sample every 4th pixel
        const r = pixels[i]! / 255;
        const g = pixels[i + 1]! / 255;
        const b = pixels[i + 2]! / 255;

        // Convert to YUV (Cb/Cr)
        const cb = -0.169 * r - 0.331 * g + 0.5 * b;
        const cr = 0.5 * r - 0.419 * g - 0.081 * b;

        // Plot on scope (Cb = x, Cr = y)
        const px = cx + cb * radius * 2;
        const py = cy - cr * radius * 2;

        ctx.fillRect(px, py, 1, 1);
      }

      rafId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafId);
  }, [enabled, videoRef, size]);

  if (!enabled) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
      <canvas ref={canvasRef} width={size} height={size} style={{ borderRadius: 4 }} />
      <Typography variant="caption" color="text.secondary">Vectorscope</Typography>
    </Box>
  );
};
