import React from 'react';
import { ToggleButton, ToggleButtonGroup, Tooltip, Typography, Box } from '@mui/material';
import { Speed, PowerOff, Balance } from '@mui/icons-material';
import { usePerformanceModeContext, PerformanceMode } from '../providers/PerformanceModeProvider';

export const PerformanceModeToggle: React.FC = () => {
  const { performanceMode, setPerformanceMode, targetFPS } = usePerformanceModeContext();

  return (
    <Box display="flex" flexDirection="column" alignItems="center">
      <Tooltip title="Performance Mode">
        <ToggleButtonGroup
          value={performanceMode}
          exclusive
          onChange={(_, value: PerformanceMode) => value && setPerformanceMode(value)}
          size="large"
          aria-label="Performance Mode"
        >
          <ToggleButton value="performance" aria-label="Performance">
            <Speed fontSize="large" />
          </ToggleButton>
          <ToggleButton value="balanced" aria-label="Balanced">
            <Balance fontSize="large" />
          </ToggleButton>
          <ToggleButton value="off" aria-label="Power saving">
            <PowerOff fontSize="large" />
          </ToggleButton>
        </ToggleButtonGroup>
      </Tooltip>
      
      <Typography variant="caption" color="text.secondary" display="block">
        {performanceMode} • Target FPS: {targetFPS}
      </Typography>
    </Box>
  );
};
