import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PerformanceModeProvider, usePerformanceModeContext, performanceModes } from '../providers/PerformanceModeProvider';

// Test component to verify performance mode context
const TestConsumer = () => {
  const { performanceMode, targetFPS } = usePerformanceModeContext();
  return (
    <div>
      <span data-testid="mode">{performanceMode}</span>
      <span data-testid="fps">{targetFPS}</span>
    </div>
  );
};

describe('Recorder FPS Sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide correct targetFPS for balanced mode (default)', () => {
    render(
      <PerformanceModeProvider>
        <TestConsumer />
      </PerformanceModeProvider>
    );

    expect(screen.getByTestId('mode')).toHaveTextContent('balanced');
    expect(screen.getByTestId('fps')).toHaveTextContent('30');
  });

  it('should have correct FPS values defined in performanceModes', () => {
    expect(performanceModes.balanced.targetFPS).toBe(30);
    expect(performanceModes.performance.targetFPS).toBe(60);
    expect(performanceModes.off.targetFPS).toBe(0);
  });
});
