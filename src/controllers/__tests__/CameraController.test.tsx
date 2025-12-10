import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CameraController, useCameraContext } from '../CameraController';

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

const mockCapabilities = {};
const mockHardware = {};

vi.mock('../../hooks/useHardwareControls', () => ({
  useHardwareControls: () => ({
    capabilities: mockCapabilities,
    hardware: mockHardware,
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

const TestChild = () => {
  const ctx = useCameraContext();
  return <span data-testid="id">{ctx.activeDeviceId}</span>;
};

describe('CameraController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides context to children', () => {
    render(<CameraController><TestChild /></CameraController>);
    expect(screen.getByTestId('id')).toHaveTextContent('cam1');
  });
});
