import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('../../hooks/useCameraStream', () => ({
  useCameraStream: () => ({
    videoRef: { current: null },
    deviceList: [{ deviceId: 'cam1', label: 'Camera 1' }],
    activeDeviceId: 'cam1',
    setActiveDeviceId: vi.fn(),
    targetRes: { w: 1920, h: 1080 },
    targetFps: 30,
    applyFormat: vi.fn(),
    streamReady: true,
    error: null,
    availableResolutions: [],
    availableFps: [30],
  }),
  CameraError: class extends Error {},
}));

vi.mock('../../hooks/useHardwareControls', () => ({
  useHardwareControls: () => ({
    capabilities: {},
    hardware: {},
    toggleFocusMode: vi.fn(),
    setFocusDistance: vi.fn(),
    toggleExposureMode: vi.fn(),
    setShutterSpeed: vi.fn(),
    setExposureCompensation: vi.fn(),
    toggleStabilization: vi.fn(),
    toggleTorch: vi.fn(),
  }),
}));

vi.mock('../../providers/EventBus', () => ({
  eventBus: { emit: vi.fn(), on: () => () => {} },
}));

import { CameraController, useCameraContext } from '../CameraController';

const TestChild = () => {
  const ctx = useCameraContext();
  return (
    <div>
      <span data-testid="deviceId">{ctx.activeDeviceId}</span>
      <span data-testid="streamReady">{ctx.streamReady ? 'yes' : 'no'}</span>
    </div>
  );
};

describe('CameraController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides camera context to children', () => {
    render(
      <CameraController>
        <TestChild />
      </CameraController>
    );

    expect(screen.getByTestId('deviceId')).toHaveTextContent('cam1');
    expect(screen.getByTestId('streamReady')).toHaveTextContent('yes');
  });

  it('exposes camera control functions', () => {
    let contextValue: ReturnType<typeof useCameraContext> | null = null;
    
    const CaptureContext = () => {
      contextValue = useCameraContext();
      return null;
    };

    render(
      <CameraController>
        <CaptureContext />
      </CameraController>
    );

    expect(contextValue).not.toBeNull();
    expect(typeof contextValue!.setActiveDeviceId).toBe('function');
    expect(typeof contextValue!.applyFormat).toBe('function');
    expect(contextValue!.deviceList).toHaveLength(1);
  });
});
