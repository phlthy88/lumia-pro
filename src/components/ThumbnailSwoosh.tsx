import React, { useEffect, useState } from 'react';
import { Box, keyframes } from '@mui/material';

interface ThumbnailSwooshProps {
    thumbnailUrl: string | null;
    onComplete: () => void;
}

const swoosh = keyframes`
    0% {
        transform: translate(0, 0) scale(1);
        opacity: 1;
    }
    100% {
        transform: translate(calc(50vw - 50px), calc(-50vh + 50px)) scale(0.3);
        opacity: 0;
    }
`;

export const ThumbnailSwoosh: React.FC<ThumbnailSwooshProps> = ({ thumbnailUrl, onComplete }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (thumbnailUrl) {
            setShow(true);
            const timer = setTimeout(() => {
                setShow(false);
                onComplete();
            }, 1200);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [thumbnailUrl, onComplete]);

    if (!show || !thumbnailUrl) return null;

    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 100,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 80,
                height: 80,
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: 4,
                zIndex: 9999,
                pointerEvents: 'none',
                animation: `${swoosh} 1.2s cubic-bezier(0.4, 0.0, 0.2, 1) forwards`,
            }}
        >
            <Box
                component="img"
                src={thumbnailUrl}
                sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                }}
            />
        </Box>
    );
};
