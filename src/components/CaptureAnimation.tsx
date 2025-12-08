import React, { useEffect, useState } from 'react';
import { Box, keyframes } from '@mui/material';

const flyToLibrary = keyframes`
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
    border-radius: 8px;
  }
  100% {
    transform: translate(var(--target-x), var(--target-y)) scale(0.1);
    opacity: 0;
    border-radius: 50%;
  }
`;

interface CaptureAnimationProps {
  imageUrl: string | null;
  onComplete: () => void;
}

export const CaptureAnimation: React.FC<CaptureAnimationProps> = ({ imageUrl, onComplete }) => {
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!imageUrl) return;

    // Find the Media nav item (bottom-left on desktop, bottom-center on mobile)
    const mediaBtn = document.querySelector('[aria-label="Media"]') as HTMLElement;
    if (mediaBtn) {
      const rect = mediaBtn.getBoundingClientRect();
      const startX = window.innerWidth / 2;
      const startY = window.innerHeight / 2;
      setTargetPos({
        x: rect.left + rect.width / 2 - startX,
        y: rect.top + rect.height / 2 - startY
      });
    } else {
      // Fallback: bottom-left corner
      setTargetPos({ x: -window.innerWidth / 2 + 40, y: window.innerHeight / 2 - 40 });
    }

    const timer = setTimeout(onComplete, 1200);
    return () => clearTimeout(timer);
  }, [imageUrl, onComplete]);

  if (!imageUrl) return null;

  return (
    <Box
      role="status"
      aria-live="polite"
      aria-label="Capture animation"
      sx={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        width: 200,
        height: 200,
        marginLeft: -100,
        marginTop: -100,
        zIndex: 10000,
        pointerEvents: 'none',
        '--target-x': `${targetPos.x}px`,
        '--target-y': `${targetPos.y}px`,
        animation: `${flyToLibrary} 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        borderRadius: 2,
      } as any}
    >
      <img 
        src={imageUrl} 
        alt="Captured photo animating to media library" 
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
      />
    </Box>
  );
};
