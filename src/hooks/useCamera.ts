import { useRef, useState, useEffect, useCallback } from 'react';

interface CameraDevice {
  deviceId: string;
  label: string;
}

interface CameraState {
  stream: MediaStream | null;
  devices: CameraDevice[];
  currentDeviceId: string;
  isLoading: boolean;
  error: string | null;
}

export const useCamera = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<CameraState>({
    stream: null,
    devices: [],
    currentDeviceId: '',
    isLoading: false,
    error: null
  });

  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`
        }));
      
      setState(prev => ({ ...prev, devices: videoDevices }));
      return videoDevices;
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to get camera devices' }));
      return [];
    }
  }, []);

  const startCamera = useCallback(async (deviceId?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setState(prev => ({
        ...prev,
        stream,
        currentDeviceId: deviceId || '',
        isLoading: false
      }));

      return stream;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to start camera',
        isLoading: false
      }));
      throw error;
    }
  }, [state.stream]);

  const switchCamera = useCallback((deviceId: string) => {
    return startCamera(deviceId);
  }, [startCamera]);

  const stopCamera = useCallback(() => {
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
      setState(prev => ({ ...prev, stream: null }));
    }
  }, [state.stream]);

  useEffect(() => {
    getDevices();
    return () => stopCamera();
  }, [getDevices, stopCamera]);

  return {
    videoRef,
    stream: state.stream,
    devices: state.devices,
    currentDeviceId: state.currentDeviceId,
    isLoading: state.isLoading,
    error: state.error,
    startCamera,
    switchCamera,
    stopCamera,
    getDevices
  };
};
