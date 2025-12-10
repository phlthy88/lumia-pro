import React, { useEffect, useState } from 'react';
import { Box, keyframes } from '@mui/material';

interface ThumbnailSwooshProps {
    thumbnailUrl: string | null;
    onComplete: () => void;
}

export const ThumbnailSwoosh: React.FC<ThumbnailSwooshProps> = ({ thumbnailUrl, onComplete }) => {
    const [show, setShow] = useState(false);
    const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [imageLoaded, setImageLoaded] = useState(false);
    const timerRef = React.useRef<number | null>(null);

    useEffect(() => {
        if (thumbnailUrl) {
            setImageLoaded(false);
            setShow(true);
            
            // Calculate start position (center-bottom of screen, above controls)
            const startX = window.innerWidth / 2;
            const startY = window.innerHeight - 150;
            setStartPos({ x: startX, y: startY });
            
            // Find the Media nav item
            const mediaBtn = document.querySelector('[aria-label="Media"]') as HTMLElement;
            if (mediaBtn) {
                const rect = mediaBtn.getBoundingClientRect();
                setTargetPos({
                    x: rect.left + rect.width / 2 - startX,
                    y: rect.top + rect.height / 2 - startY
                });
            } else {
                // Fallback
                setTargetPos({ x: -startX + 60, y: -startY + window.innerHeight - 60 });
            }

            return () => {
                if (timerRef.current) {
                    clearTimeout(timerRef.current);
                    timerRef.current = null;
                }
            };
        }
        return undefined;
    }, [thumbnailUrl, onComplete]);

    const handleImageLoaded = () => {
        setImageLoaded(true);
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = window.setTimeout(() => {
            setShow(false);
            timerRef.current = null;
            onComplete();
        }, 800);
    };

    if (!show || !thumbnailUrl) return null;

    const swoosh = keyframes`
        0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
        }
        100% {
            transform: translate(${targetPos.x}px, ${targetPos.y}px) scale(0.2);
            opacity: 0;
        }
    `;

    return (
        <Box
            sx={{
                position: 'fixed',
                left: startPos.x - 40,
                top: startPos.y - 40,
                width: 80,
                height: 80,
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                zIndex: 9999,
                pointerEvents: 'none',
                border: '2px solid white',
                animation: imageLoaded ? `${swoosh} 0.8s cubic-bezier(0.4, 0.0, 0.2, 1) forwards` : 'none',
                opacity: imageLoaded ? 1 : 0,
            }}
        >
            <Box
                component="img"
                src={thumbnailUrl}
                onLoad={handleImageLoaded}
                sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                }}
            />
        </Box>
    );
};
