import React from 'react';
import { ToggleButton, ToggleButtonGroup, Tooltip, Typography, Box } from '@mui/material';
import { Speed, HighQuality, Balance } from '@mui/icons-material';
import { usePerformanceMode, type PerformanceMode } from '../hooks/usePerformanceMode';

export const PerformanceModeToggle: React.FC = () => {
  const { mode, setMode, settings } = usePerformanceMode();

  return (
    <Box>
      <Tooltip title="Performance Mode">
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, value: PerformanceMode) => value && setMode(value)}
          size="small"
        >
          <ToggleButton value="performance">
            <Speed fontSize="small" />
          </ToggleButton>
          <ToggleButton value="balanced">
            <Balance fontSize="small" />
          </ToggleButton>
          <ToggleButton value="quality">
            <HighQuality fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
      </Tooltip>
      
      <Typography variant="caption" color="text.secondary" display="block">
        {mode} • AI: {settings.aiEnabled ? 'On' : 'Off'} • Scale: {settings.resolutionScale}
      </Typography>
    </Box>
  );
};
