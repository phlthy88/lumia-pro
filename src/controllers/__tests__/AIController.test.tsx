import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('../CameraController', () => ({
  useCameraContext: () => ({ videoRef: { current: null }, streamReady: true }),
}));

vi.mock('../RenderController', () => ({
  useRenderContext: () => ({ 
    canvasRef: { current: null }, 
    setColor: vi.fn(), 
    undo: vi.fn(), 
    canUndo: false 
  }),
}));

vi.mock('../../providers/UIStateProvider', () => ({
  useUIState: () => ({ activeTab: 'AI', showToast: vi.fn() }),
}));

vi.mock('../../services/AIAnalysisService', () => ({
  aiService: { analyze: vi.fn().mockResolvedValue({ score: {}, tips: [], autoParams: {}, faces: 0 }), dispose: vi.fn() },
}));

vi.mock('../../hooks/useVisionWorker', () => ({
  useVisionWorker: () => ({ landmarks: null, hasFace: false, ready: false }),
}));

vi.mock('../../hooks/useAIAnalysis', () => ({
  useAIAnalysis: () => ({ result: null, isAnalyzing: false, runAnalysis: vi.fn(), autoParams: null }),
}));

vi.mock('../../beauty/MaskGenerator', () => ({
  MaskGenerator: class MockMaskGenerator {
    update = vi.fn();
    getCanvas = vi.fn().mockReturnValue(null);
    getCanvas2 = vi.fn().mockReturnValue(null);
  },
}));

vi.mock('../../providers/EventBus', () => ({
  eventBus: { emit: vi.fn(), on: () => () => {} },
}));

import { AIController, useAIContext } from '../AIController';

const TestChild = () => {
  const ctx = useAIContext();
  return <span data-testid="analyzing">{ctx.isAnalyzing ? 'yes' : 'no'}</span>;
};

import { PerformanceModeProvider } from '../../providers/PerformanceModeProvider';
// ... other imports

// ... mocks

// ... TestChild component

describe('AIController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides context to children', () => {
    render(
      <PerformanceModeProvider>
        <AIController><TestChild /></AIController>
      </PerformanceModeProvider>
    );
    expect(screen.getByTestId('analyzing')).toHaveTextContent('no');
  });
});

