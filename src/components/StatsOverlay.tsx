import React, { useEffect, useState, MutableRefObject } from 'react';
import { Box, Typography, keyframes, useTheme, Chip } from '@mui/material';
import { Warning, Memory } from '@mui/icons-material';
import { EngineStats } from '../types';
import { usePerformanceProfile } from '../hooks/usePerformanceProfile';

const pulse = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
`;

const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
`;

interface StatsOverlayProps {
    statsRef: MutableRefObject<EngineStats>;
    gyroAngleRef: MutableRefObject<number>;
    bypass: boolean;
    isRecording: boolean;
    recordingTime: number;
    midiConnected?: boolean;
}

export const StatsOverlay: React.FC<StatsOverlayProps> = ({ 
    statsRef, gyroAngleRef, bypass, isRecording, recordingTime, midiConnected 
}) => {
    const theme = useTheme();
    const [displayStats, setDisplayStats] = useState<EngineStats>({
        fps: 0, frameTime: 0, droppedFrames: 0, resolution: '-'
    });
    const [displayGyro, setDisplayGyro] = useState(0);

    // Performance Profiling Hook
    const { isLowPerformance, memoryMB } = usePerformanceProfile();

    useEffect(() => {
        let rAF: number;
        let lastUpdate = 0;
        const loop = (now: number) => {
            if (now - lastUpdate > 100) {
                setDisplayStats({...statsRef.current});
                setDisplayGyro(gyroAngleRef.current);
                lastUpdate = now;
            }
            rAF = requestAnimationFrame(loop);
        };
        rAF = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rAF);
    }, []);

    return (
        <Box 
            role="status"
            aria-live="polite"
            aria-label="Performance statistics"
            sx={{ 
                position: 'absolute', 
                top: 16, 
                left: 16, 
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                alignItems: 'flex-start',
                zIndex: 10,
                pointerEvents: 'none'
            }}
        >
            <Box sx={{
                bgcolor: theme.palette.background.surfaceVariant,
                backdropFilter: 'blur(8px)', 
                p: 1.5, 
                borderRadius: 2, 
                border: `1px solid ${theme.palette.outline}`,
                fontFamily: 'monospace',
                fontSize: 11,
                color: theme.palette.background.onSurfaceVariant,
                animation: `${fadeIn} 0.3s ease-out`,
                transition: 'all 0.3s ease',
                opacity: 0.7,
            }}>
                <Box sx={{ 
                    color: displayStats.fps < 20 ? theme.palette.warning.main : theme.palette.primary.main,
                    fontWeight: 600,
                }}>
                    FPS: {displayStats.fps}
                </Box>
                <Box sx={{ color: theme.palette.secondary.main }}>
                    RES: {displayStats.resolution}
                </Box>
                <Box sx={{ 
                    color: theme.palette.tertiary.main,
                    transform: `rotate(${displayGyro * 0.1}deg)`,
                    transition: 'transform 0.1s ease',
                }}>
                    GYRO: {Math.round(displayGyro)}°
                </Box>
                {midiConnected && (
                    <Box sx={{
                        color: theme.palette.success.main,
                        fontWeight: 600,
                    }}>
                        🎹 MIDI
                    </Box>
                )}
                {bypass && (
                    <Box sx={{
                        color: theme.palette.warning.main,
                        fontWeight: 'bold',
                        animation: `${pulse} 1.5s ease-in-out infinite`
                    }}>
                        BYPASS
                    </Box>
                )}
                {isRecording && (
                    <Box sx={{
                        color: theme.palette.error.main,
                        fontWeight: 'bold',
                        animation: `${pulse} 1s ease-in-out infinite`
                    }}>
                        ● REC {new Date(recordingTime * 1000).toISOString().substr(14, 5)}
                    </Box>
                )}
            </Box>

            {/* Performance Warnings */}
            {isLowPerformance && (
                <Chip
                    icon={<Warning />}
                    label="Low Performance"
                    color="warning"
                    size="small"
                    sx={{ animation: `${fadeIn} 0.3s ease-out` }}
                />
            )}

            {memoryMB > 500 && (
                <Chip
                    icon={<Memory />}
                    label={`High Mem: ${memoryMB}MB`}
                    color="error"
                    size="small"
                    sx={{ animation: `${fadeIn} 0.3s ease-out` }}
                />
            )}
        </Box>
    );
};
