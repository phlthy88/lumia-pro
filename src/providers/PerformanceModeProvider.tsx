import { createContext, useContext, useState, useMemo, ReactNode } from 'react';

// Define performance modes and their settings directly in the provider
// to avoid circular dependencies and to centralize the logic.
export const performanceModes = {
  off: {
    name: 'Off',
    targetFPS: 0, // A value of 0 can indicate that the default browser animation rate should be used.
    resolution: { width: 0, height: 0 },
    features: {
      backgroundBlur: false,
      autoFraming: false,
      noiseCancellation: false,
    },
  },
  balanced: {
    name: 'Balanced',
    targetFPS: 30,
    resolution: { width: 1280, height: 720 },
    features: {
      backgroundBlur: true,
      autoFraming: true,
      noiseCancellation: true,
    },
  },
  performance: {
    name: 'Performance',
    targetFPS: 60,
    resolution: { width: 1920, height: 1080 },
    features: {
      backgroundBlur: false,
      autoFraming: false,
      noiseCancellation: false,
    },
  },
};

export type PerformanceMode = keyof typeof performanceModes;


interface PerformanceModeContextType {
  performanceMode: PerformanceMode;
  setPerformanceMode: (mode: PerformanceMode) => void;
  targetFPS: number;
}

const PerformanceModeContext = createContext<PerformanceModeContextType | undefined>(undefined);

export const usePerformanceModeContext = () => {
  const context = useContext(PerformanceModeContext);
  if (!context) {
    throw new Error('usePerformanceModeContext must be used within a PerformanceModeProvider');
  }
  return context;
};

interface PerformanceModeProviderProps {
  children: ReactNode;
}

export const PerformanceModeProvider = ({ children }: PerformanceModeProviderProps) => {
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>('balanced');

  const targetFPS = useMemo(() => {
    return performanceModes[performanceMode].targetFPS;
  }, [performanceMode]);

  const value = {
    performanceMode,
    setPerformanceMode,
    targetFPS,
  };

  return (
    <PerformanceModeContext.Provider value={value}>
      {children}
    </PerformanceModeContext.Provider>
  );
};
