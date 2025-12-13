import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('../RenderController', () => ({
  useRenderContext: () => ({ canvasRef: { current: null } }),
}));

vi.mock('../../services/MediaStorageService', () => ({
  mediaStorage: {
    listMetadata: vi.fn().mockResolvedValue([]),
    getBlob: vi.fn().mockResolvedValue(null),
    saveBlob: vi.fn().mockResolvedValue(undefined),
    deleteBlob: vi.fn().mockResolvedValue(undefined),
    getTotalSize: vi.fn().mockResolvedValue(0),
    clear: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../providers/EventBus', () => ({
  eventBus: { emit: vi.fn(), on: () => () => {} },
}));

import { PerformanceModeProvider } from '../../providers/PerformanceModeProvider';
import { RecordingController, useRecordingContext } from '../RecordingController';

const TestChild = () => {
  const ctx = useRecordingContext();
  return (
    <div>
      <span data-testid="recording">{ctx.isRecording ? 'yes' : 'no'}</span>
      <span data-testid="error">{ctx.error ? 'error' : 'no'}</span>
    </div>
  );
};

describe('RecordingController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides recording context to children', () => {
    render(
      <PerformanceModeProvider>
        <RecordingController>
          <TestChild />
        </RecordingController>
      </PerformanceModeProvider>
    );

    expect(screen.getByTestId('recording')).toHaveTextContent('no');
    expect(screen.getByTestId('error')).toHaveTextContent('no');
  });
});
