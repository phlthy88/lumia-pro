import React, { useEffect, useState } from 'react';
import { Box, keyframes } from '@mui/material';

const flash = keyframes`
  0% { opacity: 0; }
  10% { opacity: 1; }
  100% { opacity: 0; }
`;

const flyToLibrary = keyframes`
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
    border-radius: 8px;
  }
  100% {
    transform: translate(var(--target-x), var(--target-y)) scale(0.15);
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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    if (!imageUrl) {
      setImageLoaded(false);
      return;
    }

    // Show flash effect
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 150);

    // Find the Media nav item
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
      setTargetPos({ x: -window.innerWidth / 2 + 60, y: window.innerHeight / 2 - 60 });
    }

    const timer = setTimeout(onComplete, 1000);
    return () => clearTimeout(timer);
  }, [imageUrl, onComplete]);

  if (!imageUrl) return null;

  return (
    <>
      {/* Flash effect */}
      {showFlash && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: 'white',
            zIndex: 9998,
            pointerEvents: 'none',
            animation: `${flash} 0.15s ease-out forwards`,
          }}
        />
      )}
      
      {/* Flying thumbnail */}
      <Box
        role="status"
        aria-live="polite"
        aria-label="Capture animation"
        sx={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          width: 160,
          height: 160,
          marginLeft: -80,
          marginTop: -80,
          zIndex: 10000,
          pointerEvents: 'none',
          '--target-x': `${targetPos.x}px`,
          '--target-y': `${targetPos.y}px`,
          animation: imageLoaded ? `${flyToLibrary} 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards` : 'none',
          opacity: imageLoaded ? 1 : 0,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          borderRadius: 2,
          border: '3px solid white',
        } as any}
      >
        <img 
          src={imageUrl} 
          alt="Captured" 
          onLoad={() => setImageLoaded(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
      </Box>
    </>
  );
};
