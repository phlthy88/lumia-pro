import React from 'react';
import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import type { QualityState } from '../engine/AdaptiveQuality';

export type PerformanceTier = 'auto' | 'high' | 'medium' | 'low';

interface Props {
  currentTier: PerformanceTier;
  onTierChange: (tier: PerformanceTier) => void;
  recommendation?: QualityState;
  fps?: number;
}

export const PerformanceModeToggle: React.FC<Props> = ({ 
  currentTier, 
  onTierChange, 
  recommendation,
  fps 
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <ToggleButtonGroup
        value={currentTier}
        exclusive
        onChange={(_, v) => v && onTierChange(v)}
        size="small"
        fullWidth
      >
        <ToggleButton value="auto">Auto</ToggleButton>
        <ToggleButton value="high">High</ToggleButton>
        <ToggleButton value="medium">Medium</ToggleButton>
        <ToggleButton value="low">Low</ToggleButton>
      </ToggleButtonGroup>

      {currentTier === 'auto' && recommendation && (
        <Typography variant="caption" color="text.secondary">
          Current: {recommendation.tier} {recommendation.reason && `(${recommendation.reason})`}
        </Typography>
      )}

      {fps !== undefined && fps > 0 && (
        <Typography variant="caption" color="text.secondary">
          {fps.toFixed(0)} FPS
        </Typography>
      )}
    </Box>
  );
};
