import { TestBed } from './TestBed';
import App from '../App';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, Mock } from 'vitest';
import { act } from 'react';
import { useRecorder } from '../hooks/useRecorder'; // Import the mocked useRecorder

// Mock GLRenderer and related hooks to prevent shader compilation errors
vi.mock('../engine/GLRenderer', () => ({
  GLRenderer: vi.fn().mockImplementation(() => ({
    initShaders: vi.fn(),
    dispose: vi.fn(),
    resize: vi.fn(),
    render: vi.fn(),
    setLutTexture: vi.fn(),
    setBeautyEnabled: vi.fn(),
    setBeautyIntensity: vi.fn(),
    setBrightness: vi.fn(),
    setContrast: vi.fn(),
    setSaturation: vi.fn(),
    setHue: vi.fn(),
    setExposure: vi.fn(),
    setTemperature: vi.fn(),
    setTint: vi.fn(),
    setVibrance: vi.fn(),
    setShadows: vi.fn(),
    setHighlights: vi.fn(),
    setClarity: vi.fn(),
    setSharpening: vi.fn(),
    setVignette: vi.fn(),
    setFilmGrain: vi.fn(),
    setNoiseReduction: vi.fn(),
    setColorGradingEnabled: vi.fn(),
    setBackgroundBlur: vi.fn(),
    setBackgroundBlurIntensity: vi.fn(),
    setBackgroundReplacement: vi.fn(),
    setBackgroundReplacementEnabled: vi.fn(),
    setChromaKeyEnabled: vi.fn(),
    setChromaKeyColor: vi.fn(),
    setChromaKeyTolerance: vi.fn(),
    setChromaKeySmoothness: vi.fn(),
    setOverlayEnabled: vi.fn(),
    setOverlayTexture: vi.fn(),
    setOverlayOpacity: vi.fn(),
    setOverlayPosition: vi.fn(),
    setOverlayScale: vi.fn(),
    setOverlayRotation: vi.fn(),
  }))
}));

vi.mock('../hooks/useGLRenderer', () => ({
  useGLRenderer: vi.fn(() => ({
    canvasRef: { current: null },
    setCanvasRef: vi.fn(),
    statsRef: { current: { fps: 0, frameTime: 0, droppedFrames: 0, resolution: '1920x1080' } },
    setLut: vi.fn(),
    setBeautyMask: vi.fn(),
    setBeautyMask2: vi.fn(),
    error: null,
  }))
}));

// Mock other hooks that might cause issues
vi.mock('../hooks/useColorGrading', () => ({
  useColorGrading: vi.fn(() => ({
    color: {},
    transform: {},
    mode: 'Standard',
    bypass: false,
    presets: [],
    activeLutIndex: 0,
    availableLuts: [],
    wipePosition: 0,
    setWipePosition: vi.fn(),
    setMode: vi.fn(),
    toggleBypass: vi.fn(),
    handleColorChange: vi.fn(),
    handleTransformChange: vi.fn(),
    resetAll: vi.fn(),
    savePreset: vi.fn(),
    loadPreset: vi.fn(),
    deletePreset: vi.fn(),
    undo: vi.fn(),
    canUndo: false,
  }))
}));

vi.mock('../hooks/useOverlays', () => ({
  useOverlays: vi.fn(() => ({
    overlays: [],
    addOverlay: vi.fn(),
    updateOverlay: vi.fn(),
    removeOverlay: vi.fn(),
    reorderOverlays: vi.fn(),
    toggleOverlay: vi.fn(),
    setOverlayTexture: vi.fn(),
    setOverlayOpacity: vi.fn(),
    setOverlayPosition: vi.fn(),
    setOverlayScale: vi.fn(),
    setOverlayRotation: vi.fn(),
  }))
}));

vi.mock('../hooks/useVirtualCamera', () => ({
  useVirtualCamera: vi.fn(() => ({
    virtualCamera: {
      initialize: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      isRunning: false,
    },
  }))
}));

vi.mock('../hooks/useDeferredInit', () => ({
  useDeferredInit: () => true,
}));

// Mock PlatformBoostsPanel to avoid width error
vi.mock('../components/PlatformBoostsPanel', () => ({
  PlatformBoostsPanel: () => <div>Platform Boosts Panel</div>,
}));

// Mock camera permissions to avoid camera error
vi.mock('../services/PermissionManager', () => ({
  PermissionManager: {
    getInstance: vi.fn(() => ({
      requestCameraPermission: vi.fn().mockResolvedValue(true),
      requestMicrophonePermission: vi.fn().mockResolvedValue(true),
      hasCameraPermission: vi.fn().mockReturnValue(true),
      hasMicrophonePermission: vi.fn().mockReturnValue(true),
    })),
  },
}));

describe('Recorder FPS Sync', () => {
  it('should use the correct targetFPS from PerformanceModeProvider', async () => {
    // Arrange - Render the app to initialize the performance mode system
    render(<TestBed><App /></TestBed>);

    // Wait for the app to be fully loaded
    await waitFor(() => {
      screen.getByRole('button', { name: /Start recording/i });
    });

    // Assert - Verify that useRecorder was called with the correct targetFPS
    const mockCalls = (useRecorder as Mock).mock.calls;
    
    // Should have been called at least once with the default performance mode
    expect(mockCalls.length).greaterThan(0);
    
    // Check the last call to verify targetFPS
    const lastCall = mockCalls[mockCalls.length - 1];
    expect(lastCall?.[1]).equal(30); // Default balanced mode should be 30fps
    
    console.log('✅ Test passed: PerformanceModeProvider is working correctly');
    console.log('✅ useRecorder called with targetFPS:', lastCall?.[1]);
    console.log('✅ App loaded successfully without shader compilation errors');
  });
});
