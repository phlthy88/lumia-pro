import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock useRecorder hook with all required functions
vi.mock('../../hooks/useRecorder', () => ({
  useRecorder: vi.fn(() => ({
    isRecording: false,
    isCountingDown: false,
    isPhotoCountingDown: false,
    isBursting: false,
    countdown: 0,
    photoCountdown: 0,
    recordingTime: 0,
    config: { countdown: 0, photoCountdown: 0 },
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
  })),
}));

// Mock RenderController
vi.mock('../RenderController', () => ({
  useRenderContext: vi.fn(() => ({
    canvasRef: { current: document.createElement('canvas') },
    triggerCaptureAnim: vi.fn(),
    triggerSwooshAnim: vi.fn(),
  })),
}));

// Mock PerformanceModeProvider
vi.mock('../../providers/PerformanceModeProvider', () => ({
  usePerformanceModeContext: vi.fn(() => ({
    performanceMode: 'balanced',
    targetFPS: 30,
    setPerformanceMode: vi.fn(),
  })),
}));

// Mock EventBus
vi.mock('../../providers/EventBus', () => ({
  eventBus: {
    on: vi.fn(() => vi.fn()),
    emit: vi.fn(),
  },
}));

// Mock MuiRecorderSettings
vi.mock('../../components/MuiRecorderSettings', () => ({
  MuiRecorderSettings: () => <div data-testid="recorder-settings">Settings</div>,
}));

// Mock AudioContext
class MockAudioContext {
  createOscillator = vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    disconnect: vi.fn(),
    frequency: { value: 440 },
  }));
  createGain = vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    gain: { value: 0.3, exponentialRampToValueAtTime: vi.fn() },
  }));
  destination = {};
  currentTime = 0;
}
(global as any).AudioContext = MockAudioContext;

describe('RecordingController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides recording context to children', async () => {
    const { RecordingController, useRecordingContext } = await import('../RecordingController');

    const TestChild = () => {
      const ctx = useRecordingContext();
      return <div data-testid="recording-state">{ctx.isRecording ? 'recording' : 'idle'}</div>;
    };

    render(
      <RecordingController>
        <TestChild />
      </RecordingController>
    );

    expect(screen.getByTestId('recording-state')).toHaveTextContent('idle');
  });

  it('throws error when useRecordingContext used outside provider', async () => {
    const { useRecordingContext } = await import('../RecordingController');

    const TestChild = () => {
      useRecordingContext();
      return null;
    };

    expect(() => render(<TestChild />)).toThrow('useRecordingContext must be used within RecordingController');
  });

  it('exposes startRecording function', async () => {
    const { RecordingController, useRecordingContext } = await import('../RecordingController');

    const TestChild = () => {
      const ctx = useRecordingContext();
      return <div data-testid="has-start">{typeof ctx.startRecording}</div>;
    };

    render(
      <RecordingController>
        <TestChild />
      </RecordingController>
    );

    expect(screen.getByTestId('has-start')).toHaveTextContent('function');
  });

  it('exposes stopRecording function', async () => {
    const { RecordingController, useRecordingContext } = await import('../RecordingController');

    const TestChild = () => {
      const ctx = useRecordingContext();
      return <div data-testid="has-stop">{typeof ctx.stopRecording}</div>;
    };

    render(
      <RecordingController>
        <TestChild />
      </RecordingController>
    );

    expect(screen.getByTestId('has-stop')).toHaveTextContent('function');
  });

  it('exposes takeScreenshot function', async () => {
    const { RecordingController, useRecordingContext } = await import('../RecordingController');

    const TestChild = () => {
      const ctx = useRecordingContext();
      return <div data-testid="has-screenshot">{typeof ctx.takeScreenshot}</div>;
    };

    render(
      <RecordingController>
        <TestChild />
      </RecordingController>
    );

    expect(screen.getByTestId('has-screenshot')).toHaveTextContent('function');
  });

  it('exposes mediaItems array', async () => {
    const { RecordingController, useRecordingContext } = await import('../RecordingController');

    const TestChild = () => {
      const ctx = useRecordingContext();
      return <div data-testid="media-items">{Array.isArray(ctx.mediaItems) ? 'array' : 'not-array'}</div>;
    };

    render(
      <RecordingController>
        <TestChild />
      </RecordingController>
    );

    expect(screen.getByTestId('media-items')).toHaveTextContent('array');
  });

  it('exposes config object', async () => {
    const { RecordingController, useRecordingContext } = await import('../RecordingController');

    const TestChild = () => {
      const ctx = useRecordingContext();
      return <div data-testid="has-config">{typeof ctx.config}</div>;
    };

    render(
      <RecordingController>
        <TestChild />
      </RecordingController>
    );

    expect(screen.getByTestId('has-config')).toHaveTextContent('object');
  });

  it('exposes recordingTime', async () => {
    const { RecordingController, useRecordingContext } = await import('../RecordingController');

    const TestChild = () => {
      const ctx = useRecordingContext();
      return <div data-testid="recording-time">{ctx.recordingTime}</div>;
    };

    render(
      <RecordingController>
        <TestChild />
      </RecordingController>
    );

    expect(screen.getByTestId('recording-time')).toHaveTextContent('0');
  });

  it('exposes takeBurst function', async () => {
    const { RecordingController, useRecordingContext } = await import('../RecordingController');

    const TestChild = () => {
      const ctx = useRecordingContext();
      return <div data-testid="has-burst">{typeof ctx.takeBurst}</div>;
    };

    render(
      <RecordingController>
        <TestChild />
      </RecordingController>
    );

    expect(screen.getByTestId('has-burst')).toHaveTextContent('function');
  });

  it('exposes cancelCountdown function', async () => {
    const { RecordingController, useRecordingContext } = await import('../RecordingController');

    const TestChild = () => {
      const ctx = useRecordingContext();
      return <div data-testid="has-cancel">{typeof ctx.cancelCountdown}</div>;
    };

    render(
      <RecordingController>
        <TestChild />
      </RecordingController>
    );

    expect(screen.getByTestId('has-cancel')).toHaveTextContent('function');
  });
});
