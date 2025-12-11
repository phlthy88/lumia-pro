import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { PerformanceModeProvider, usePerformanceModeContext, performanceModes } from '../PerformanceModeProvider';

describe('PerformanceModeProvider', () => {
  const TestChild = () => {
    const { performanceMode, targetFPS, setPerformanceMode } = usePerformanceModeContext();
    return (
      <div>
        <span data-testid="mode">{performanceMode}</span>
        <span data-testid="fps">{targetFPS}</span>
        <button onClick={() => setPerformanceMode('performance')}>Set Performance</button>
        <button onClick={() => setPerformanceMode('off')}>Set Off</button>
      </div>
    );
  };

  it('provides default balanced mode', () => {
    render(
      <PerformanceModeProvider>
        <TestChild />
      </PerformanceModeProvider>
    );

    expect(screen.getByTestId('mode')).toHaveTextContent('balanced');
  });

  it('provides correct targetFPS for balanced mode', () => {
    render(
      <PerformanceModeProvider>
        <TestChild />
      </PerformanceModeProvider>
    );

    expect(screen.getByTestId('fps')).toHaveTextContent('30');
  });

  it('allows changing to performance mode', () => {
    render(
      <PerformanceModeProvider>
        <TestChild />
      </PerformanceModeProvider>
    );

    act(() => {
      screen.getByText('Set Performance').click();
    });

    expect(screen.getByTestId('mode')).toHaveTextContent('performance');
    expect(screen.getByTestId('fps')).toHaveTextContent('60');
  });

  it('allows changing to off mode', () => {
    render(
      <PerformanceModeProvider>
        <TestChild />
      </PerformanceModeProvider>
    );

    act(() => {
      screen.getByText('Set Off').click();
    });

    expect(screen.getByTestId('mode')).toHaveTextContent('off');
    expect(screen.getByTestId('fps')).toHaveTextContent('0');
  });

  it('throws error when used outside provider', () => {
    const TestOutside = () => {
      usePerformanceModeContext();
      return null;
    };

    expect(() => render(<TestOutside />)).toThrow(
      'usePerformanceModeContext must be used within a PerformanceModeProvider'
    );
  });
});

describe('performanceModes', () => {
  it('has off mode', () => {
    expect(performanceModes.off).toBeDefined();
    expect(performanceModes.off.name).toBe('Off');
    expect(performanceModes.off.targetFPS).toBe(0);
  });

  it('has balanced mode', () => {
    expect(performanceModes.balanced).toBeDefined();
    expect(performanceModes.balanced.name).toBe('Balanced');
    expect(performanceModes.balanced.targetFPS).toBe(30);
    expect(performanceModes.balanced.resolution).toEqual({ width: 1280, height: 720 });
  });

  it('has performance mode', () => {
    expect(performanceModes.performance).toBeDefined();
    expect(performanceModes.performance.name).toBe('Performance');
    expect(performanceModes.performance.targetFPS).toBe(60);
    expect(performanceModes.performance.resolution).toEqual({ width: 1920, height: 1080 });
  });

  it('balanced mode has all features enabled', () => {
    expect(performanceModes.balanced.features.backgroundBlur).toBe(true);
    expect(performanceModes.balanced.features.autoFraming).toBe(true);
    expect(performanceModes.balanced.features.noiseCancellation).toBe(true);
  });

  it('performance mode has features disabled for speed', () => {
    expect(performanceModes.performance.features.backgroundBlur).toBe(false);
    expect(performanceModes.performance.features.autoFraming).toBe(false);
    expect(performanceModes.performance.features.noiseCancellation).toBe(false);
  });
});
