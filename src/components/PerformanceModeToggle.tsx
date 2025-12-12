import React from 'react';
import { ToggleButton, ToggleButtonGroup, Tooltip, Typography, Box } from '@mui/material';
import { Speed, PowerOff, Balance } from '@mui/icons-material';
import { usePerformanceModeContext, PerformanceMode } from '../providers/PerformanceModeProvider';

export const PerformanceModeToggle: React.FC = () => {
  const { performanceMode, setPerformanceMode, targetFPS } = usePerformanceModeContext();

  return (
    <Box display="flex" flexDirection="column" alignItems="center">
      <ToggleButtonGroup
        value={performanceMode}
        exclusive
        onChange={(_, value: PerformanceMode) => value && setPerformanceMode(value)}
        size="large"
        aria-label="Performance Mode"
      >
        <Tooltip title="Performance: 30fps, 960x540, essential effects only">
          <ToggleButton value="performance" aria-label="Performance">
            <Speed fontSize="large" />
          </ToggleButton>
        </Tooltip>
        <Tooltip title="Balanced: 30fps, 1280x720, most effects">
          <ToggleButton value="balanced" aria-label="Balanced">
            <Balance fontSize="large" />
          </ToggleButton>
        </Tooltip>
        <Tooltip title="Quality: 60fps, full resolution, all effects">
          <ToggleButton value="off" aria-label="Quality">
            <PowerOff fontSize="large" />
          </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>
      
      <Typography variant="caption" color="text.secondary" display="block">
        {performanceMode} • Target FPS: {targetFPS}
      </Typography>
    </Box>
  );
};
