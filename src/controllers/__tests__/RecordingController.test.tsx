import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('../RenderController', () => ({
  useRenderContext: () => ({ canvasRef: { current: null } }),
}));

vi.mock('../../hooks/useRecorder', () => ({
  useRecorder: () => ({
    isRecording: false,
    isCountingDown: false,
    isPhotoCountingDown: false,
    isBursting: false,
    countdown: 0,
    photoCountdown: 0,
    recordingTime: 0,
    config: {},
    setConfig: vi.fn(),
    audioConfig: {},
    setAudioConfig: vi.fn(),
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    takeScreenshot: vi.fn(),
    takeBurst: vi.fn(),
    cancelCountdown: vi.fn(),
    mediaItems: [],
    loadItemUrl: vi.fn(),
    deleteMedia: vi.fn(),
    clearMedia: vi.fn(),
    audioStream: null,
    error: null,
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
    expect(screen.getByTestId('error')).toHaveTextContent('no');
  });
});
