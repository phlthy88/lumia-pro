import React from 'react';
import { Box, Typography } from '@mui/material';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';

interface PerformanceOverlayProps {
  visible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  engineStats?: { fps: number; frameTime: number } | null;
}

export const PerformanceOverlay: React.FC<PerformanceOverlayProps> = ({
  visible = false,
  position = 'top-right',
  engineStats,
}) => {
  const { metrics, isHealthy } = usePerformanceMonitor(visible);

  if (!visible) return null;

  const positionStyles = {
    'top-left': { top: 8, left: 8 },
    'top-right': { top: 8, right: 8 },
    'bottom-left': { bottom: 8, left: 8 },
    'bottom-right': { bottom: 8, right: 8 },
  };

  const getFpsColor = (fps: number) => {
    if (fps >= 55) return '#4caf50';
    if (fps >= 30) return '#ff9800';
    return '#f44336';
  };

  const displayFps = engineStats?.fps ?? metrics.fps;
  const displayFrameTime = engineStats?.frameTime ?? metrics.frameTime;

  return (
    <Box
      sx={{
        position: 'fixed',
        ...positionStyles[position],
        zIndex: 9999,
        bgcolor: 'rgba(0, 0, 0, 0.75)',
        color: 'white',
        p: 1,
        borderRadius: 1,
        fontFamily: 'monospace',
        fontSize: 11,
        minWidth: 120,
        pointerEvents: 'none',
        backdropFilter: 'blur(4px)',
        border: `1px solid ${isHealthy ? '#4caf50' : '#f44336'}`,
      }}
    >
      <Typography 
        variant="caption" 
        component="div"
        sx={{ 
          color: getFpsColor(displayFps),
          fontWeight: 'bold',
          fontSize: 14,
        }}
      >
        {displayFps} FPS
      </Typography>
      
      <Typography variant="caption" component="div" sx={{ opacity: 0.8 }}>
        Frame: {displayFrameTime.toFixed(1)}ms
      </Typography>
      
      {metrics.memoryUsage !== null && (
        <Typography variant="caption" component="div" sx={{ opacity: 0.8 }}>
          Memory: {metrics.memoryUsage}MB
        </Typography>
      )}
      
      {metrics.droppedFrames > 0 && (
        <Typography variant="caption" component="div" sx={{ color: '#ff9800' }}>
          Dropped: {metrics.droppedFrames}
        </Typography>
      )}
      
      {metrics.longTasks > 0 && (
        <Typography variant="caption" component="div" sx={{ color: '#ff9800' }}>
          Long tasks: {metrics.longTasks}
        </Typography>
      )}
    </Box>
  );
};
