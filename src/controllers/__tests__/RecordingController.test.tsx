import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('../RenderController', () => ({
  useRenderContext: () => ({ canvasRef: { current: null } }),
}));

vi.mock('../../hooks/useRecorder', () => ({
  useRecorder: () => ({
    isRecording: false,
    isPaused: false,
    duration: 0,
    startRecording: vi.fn(),
    stopRecording: vi.fn().mockResolvedValue(new Blob()),
    pauseRecording: vi.fn(),
    resumeRecording: vi.fn(),
    takeSnapshot: vi.fn().mockResolvedValue(new Blob()),
  }),
}));

vi.mock('../../services/MediaStorageService', () => ({
  mediaStorageService: { saveMedia: vi.fn(), loadMedia: vi.fn().mockResolvedValue([]), deleteMedia: vi.fn(), getMediaUrl: vi.fn() },
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
    expect(screen.getByTestId('paused')).toHaveTextContent('no');
  });
});
