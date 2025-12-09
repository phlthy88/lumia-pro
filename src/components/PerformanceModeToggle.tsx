import React from 'react';
import { Typography } from '@mui/material';
import { MuiToggleGroup } from './controls/MuiToggle';
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
    <>
      <MuiToggleGroup
        value={currentTier}
        options={[
          { value: 'auto', label: 'Auto' },
          { value: 'high', label: 'High' },
          { value: 'medium', label: 'Med' },
          { value: 'low', label: 'Low' },
        ]}
        onChange={(v) => onTierChange(v as PerformanceTier)}
      />

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
    </>
  );
};
