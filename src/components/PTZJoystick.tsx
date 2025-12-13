import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Box, useTheme } from '@mui/material';
import { PTZMode } from '../types';

interface Props {
    mode: PTZMode;
    onMove: (dx: number, dy: number) => void;
    onRelease?: () => void;
    size?: number;
}

export const PTZJoystick: React.FC<Props> = ({ mode, onMove, onRelease, size = 100 }) => {
    const theme = useTheme();
    const containerRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const animRef = useRef<number>(0);

    const isPhysical = mode === 'physical';
    const mainColor = isPhysical ? theme.palette.secondary.main : theme.palette.primary.main;
    const accentColor = theme.palette.tertiary?.main ?? theme.palette.info.main;

    const maxRadius = size / 2 - 15;

    const handleMove = useCallback((clientX: number, clientY: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        let dx = clientX - cx;
        let dy = clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxRadius) {
            dx = (dx / dist) * maxRadius;
            dy = (dy / dist) * maxRadius;
        }
        setPosition({ x: dx, y: dy });
        onMove(dx / maxRadius, dy / maxRadius);
    }, [maxRadius, onMove]);

    const handleStart = useCallback((e: React.PointerEvent) => {
        e.preventDefault();
        setIsDragging(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        handleMove(e.clientX, e.clientY);
    }, [handleMove]);

    const handleMoveEvent = useCallback((e: React.PointerEvent) => {
        if (!isDragging) return;
        handleMove(e.clientX, e.clientY);
    }, [isDragging, handleMove]);

    const handleEnd = useCallback(() => {
        setIsDragging(false);
        // Animate back to center
        const animate = () => {
            setPosition(p => {
                const nx = p.x * 0.8;
                const ny = p.y * 0.8;
                if (Math.abs(nx) < 0.5 && Math.abs(ny) < 0.5) {
                    onRelease?.();
                    return { x: 0, y: 0 };
                }
                animRef.current = requestAnimationFrame(animate);
                return { x: nx, y: ny };
            });
        };
        animRef.current = requestAnimationFrame(animate);
    }, [onRelease]);

    useEffect(() => () => cancelAnimationFrame(animRef.current), []);

    if (mode === 'disabled') return null;

    return (
        <Box
            ref={containerRef}
            onPointerDown={handleStart}
            onPointerMove={handleMoveEvent}
            onPointerUp={handleEnd}
            onPointerCancel={handleEnd}
            sx={{
                width: size,
                height: size,
                borderRadius: '50%',
                bgcolor: `${mainColor}22`,
                border: `2px solid ${mainColor}`,
                position: 'relative',
                cursor: 'grab',
                touchAction: 'none',
                userSelect: 'none',
                boxShadow: `0 0 12px ${mainColor}44`,
                '&:active': { cursor: 'grabbing' }
            }}
        >
            {/* Crosshair */}
            <Box sx={{ position: 'absolute', top: '50%', left: 4, right: 4, height: 1, bgcolor: `${accentColor}66` }} />
            <Box sx={{ position: 'absolute', left: '50%', top: 4, bottom: 4, width: 1, bgcolor: `${accentColor}66` }} />
            {/* Knob */}
            <Box
                sx={{
                    position: 'absolute',
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    bgcolor: mainColor,
                    border: `2px solid ${accentColor}`,
                    top: '50%',
                    left: '50%',
                    transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                    boxShadow: `0 2px 8px ${mainColor}88`
                }}
            />
        </Box>
    );
};
