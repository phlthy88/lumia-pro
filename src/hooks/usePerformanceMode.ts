import { useState, useCallback } from 'react';
import { usePersistedState } from './usePersistedState';

export type PerformanceMode = 'quality' | 'balanced' | 'performance';

export const usePerformanceMode = () => {
  const [mode, setMode] = usePersistedState<PerformanceMode>('performanceMode', 'balanced');

  const getSettings = useCallback(() => {
    switch (mode) {
      case 'performance':
        return {
          aiEnabled: false,
          resolutionScale: 0.7,
          targetFPS: 30,
          visionFPS: 0
        };
      case 'quality':
        return {
          aiEnabled: true,
          resolutionScale: 1.0,
          targetFPS: 60,
          visionFPS: 10
        };
      default: // balanced
        return {
          aiEnabled: true,
          resolutionScale: 0.8,
          targetFPS: 30,
          visionFPS: 5
        };
    }
  }, [mode]);

  return { mode, setMode, settings: getSettings() };
};
