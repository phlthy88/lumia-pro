import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('../CameraController', () => ({
  useCameraContext: () => ({ videoRef: { current: null }, streamReady: true }),
}));

vi.mock('../RenderController', () => ({
  useRenderContext: () => ({ canvasRef: { current: null }, setParams: vi.fn() }),
}));

vi.mock('../../services/AIAnalysisService', () => ({
  aiService: { analyze: vi.fn().mockResolvedValue({ score: {}, tips: [], autoParams: {}, faces: 0 }), dispose: vi.fn() },
}));

vi.mock('../../hooks/useVisionWorker', () => ({
  useVisionWorker: () => ({ faceResult: null, isLoading: false, error: null }),
}));

// Mock MaskGenerator as a proper class
vi.mock('../../beauty/MaskGenerator', () => ({
  MaskGenerator: class MockMaskGenerator {
    generateMasks = vi.fn().mockResolvedValue({});
    dispose = vi.fn();
  },
}));

vi.mock('../../providers/EventBus', () => ({
  eventBus: { emit: vi.fn(), on: () => () => {} },
}));

// Import after mocks
import { AIController, useAIContext } from '../AIController';

const TestChild = () => {
  const ctx = useAIContext();
  return <span data-testid="analyzing">{ctx.isAnalyzing ? 'yes' : 'no'}</span>;
};

describe('AIController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides context to children', () => {
    render(<AIController><TestChild /></AIController>);
    expect(screen.getByTestId('analyzing')).toHaveTextContent('no');
  });
});
