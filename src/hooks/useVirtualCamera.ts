import { useState, useEffect, useCallback, useRef } from 'react';
import virtualCameraService, { 
  VirtualCameraState, 
  VirtualCameraConfig,
  VirtualCameraService
} from '../services/VirtualCameraService';

export interface UseVirtualCameraReturn {
  // State
  isActive: boolean;
  isWindowOpen: boolean;
  stream: MediaStream | null;
  config: VirtualCameraConfig;
  webrtcUrl?: string;
  isStreaming: boolean;

  // Actions
  initialize: (canvas: HTMLCanvasElement) => void;
  start: () => MediaStream | null;
  stop: () => void;
  openPopOut: () => Window | null;
  closePopOut: () => void;
  updateConfig: (config: Partial<VirtualCameraConfig>) => void;
  startWebRTC: () => string;
  stopWebRTC: () => void;

  // Helpers
  getSetupInstructions: (app: 'zoom' | 'meet' | 'teams' | 'obs' | 'discord') => string;
}

export function useVirtualCamera(): UseVirtualCameraReturn {
  const [state, setState] = useState<VirtualCameraState>(() => virtualCameraService.getState());
  const initializedRef = useRef(false);

  // Subscribe to service state changes
  useEffect(() => {
    const unsubscribe = virtualCameraService.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const initialize = useCallback((canvas: HTMLCanvasElement) => {
    if (initializedRef.current) return;
    
    // Load saved config
    const savedConfig = localStorage.getItem('lumina-virtual-camera-config');
    const config = savedConfig ? JSON.parse(savedConfig) : undefined;
    
    virtualCameraService.initialize(canvas, config);
    initializedRef.current = true;
  }, []);

  const start = useCallback(() => {
    return virtualCameraService.start();
  }, []);

  const stop = useCallback(() => {
    virtualCameraService.stop();
  }, []);

  const openPopOut = useCallback(() => {
    return virtualCameraService.openPopOutWindow();
  }, []);

  const closePopOut = useCallback(() => {
    virtualCameraService.closePopOutWindow();
  }, []);

  const updateConfig = useCallback((config: Partial<VirtualCameraConfig>) => {
    virtualCameraService.updateConfig(config);
  }, []);

  const getSetupInstructions = useCallback((app: 'zoom' | 'meet' | 'teams' | 'obs' | 'discord') => {
    return VirtualCameraService.getSetupInstructions(app);
  }, []);

  const startWebRTC = useCallback(() => {
    return virtualCameraService.startWebRTCStream();
  }, []);

  const stopWebRTC = useCallback(() => {
    virtualCameraService.stopWebRTCStream();
  }, []);

  return {
    isActive: state.isActive,
    isWindowOpen: state.isWindowOpen,
    stream: state.stream,
    config: state.config,
    webrtcUrl: state.webrtcUrl,
    isStreaming: state.isStreaming,
    initialize,
    start,
    stop,
    openPopOut,
    closePopOut,
    updateConfig,
    startWebRTC,
    stopWebRTC,
    getSetupInstructions
  };
}

export default useVirtualCamera;
