import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cameraService } from '../services/CameraControlService';

const RESOLUTION_PRESETS = [
    { label: '4K (UHD)', width: 3840, height: 2160 },
    { label: '1080p (FHD)', width: 1920, height: 1080 },
    { label: '720p (HD)', width: 1280, height: 720 },
    { label: '480p (SD)', width: 854, height: 480 }
];

const FPS_PRESETS = [240, 144, 120, 100, 60, 59.94, 50, 48, 30, 29.97, 25, 24, 23.98];

type StreamStatus = 'idle' | 'initializing' | 'streaming' | 'error';

export const useCameraStream = (maxFrameRateCapability?: number, maxW?: number, maxH?: number) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [deviceList, setDeviceList] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>('');
   const [targetRes, setTargetRes] = useState<{w: number, h: number}>({ 
     w: RESOLUTION_PRESETS[1]!.width, 
     h: RESOLUTION_PRESETS[1]!.height 
   }); 
  const [targetFps, setTargetFps] = useState<number>(30);
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // Device Discovery
  const refreshDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(d => d.kind === 'videoinput');
      setDeviceList(cameras);
      return cameras;
    } catch (e) {
      console.error("Failed to enumerate devices", e);
      return [];
    }
  }, []);

  // Monitor device changes
  useEffect(() => {
      navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
      return () => navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
  }, [refreshDevices]);

  // Stream Initialization with State Machine
  useEffect(() => {
    let isMounted = true;
    let activeStream: MediaStream | null = null;

    const startStream = async () => {
      if (!videoRef.current) return;
      
      // Prevent double-initialization only
      if (status === 'initializing') return;

      setStatus('initializing');
      setError(null);

      try {
        const stream = await cameraService.initialize(activeDeviceId || undefined);
        activeStream = stream;
        
        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        // Refresh device list after getting permission
        await refreshDevices();
        
        // Sync state from actual stream settings
        const settings = cameraService.getSettings();
        if (settings) {
          if (settings.deviceId) {
            setActiveDeviceId(prev => settings.deviceId || prev);
          }
          if (settings.width && settings.height) {
            setTargetRes(prev => ({ w: settings.width || prev.w, h: settings.height || prev.h }));
          }
          if (settings.frameRate) {
            // Round to nearest common FPS value
            const fps = settings.frameRate;
            const rounded = fps > 58 ? 60 : fps > 28 ? 30 : fps > 23 ? 24 : fps;
            setTargetFps(prev => rounded);
          }
        }
        
        setStatus('streaming');

        if (!videoRef.current || !isMounted) return;
        videoRef.current.srcObject = stream;
        
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) return reject(new Error("Video element unmounted"));
          const video = videoRef.current;
          if (video.readyState >= 2) return resolve();
          
          let timer: ReturnType<typeof setTimeout> | undefined;
          const onData = () => {
            video.removeEventListener('loadeddata', onData);
            if (timer) clearTimeout(timer);
            resolve();
          };
          
          timer = setTimeout(() => {
              video.removeEventListener('loadeddata', onData);
              reject(new Error("Camera initialization timed out"));
          }, 5000);

          video.addEventListener('loadeddata', onData);
        });

        if (!videoRef.current || !isMounted) return;
        await videoRef.current.play().catch(e => console.warn("Play interrupted", e));
        
        if (isMounted) setStatus('streaming');

      } catch (err) {
        console.error("Stream error", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : String(err));
          setStatus('error');
        }
      }
    };

    startStream();

    return () => {
      isMounted = false;
      activeStream?.getTracks().forEach(t => t.stop());
    };
  }, [activeDeviceId]); // Removed refreshDevices - only re-init on device change

  const applyFormat = useCallback(async (width: number, height: number, fps: number) => {
      // Guard: don't apply if stream not ready
      if (status !== 'streaming' || !cameraService.getSettings()) return;
      
      // Clamp to hardware limits
      const clampedW = maxW ? Math.min(width, maxW) : width;
      const clampedH = maxH ? Math.min(height, maxH) : height;
      const clampedFps = maxFrameRateCapability ? Math.min(fps, maxFrameRateCapability) : fps;
      
      try {
          await cameraService.setFormat(clampedW, clampedH, clampedFps);
          setTargetRes(prev => ({ w: clampedW, h: clampedH }));
          setTargetFps(prev => clampedFps);
      } catch (e) {
          console.error("Failed to change format", e);
      }
  }, [maxW, maxH, maxFrameRateCapability, status]);

  const availableResolutions = useMemo(() => {
     return RESOLUTION_PRESETS.filter(r => {
        if (!maxW || !maxH) return true;
        return r.width <= maxW && r.height <= maxH;
    });
  }, [maxW, maxH]);

  const availableFps = useMemo(() => {
      let list = [...FPS_PRESETS];
      if (maxFrameRateCapability) {
           if (!list.includes(maxFrameRateCapability)) {
               list.push(maxFrameRateCapability);
           }
           list = list.filter(f => f <= (maxFrameRateCapability + 0.1));
      }
      return list.sort((a, b) => b - a);
  }, [maxFrameRateCapability]);

  return {
    videoRef,
    deviceList,
    activeDeviceId,
    setActiveDeviceId,
    targetRes,
    targetFps,
    applyFormat,
    streamReady: status === 'streaming',
    error,
    availableResolutions,
    availableFps
  };
};
