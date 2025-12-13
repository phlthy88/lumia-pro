import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cameraService } from '../services/CameraControlService';
import { usePersistedState } from './usePersistedState';
import { getCameraErrorCode, getCameraErrorMessage, CameraErrorCode } from '../utils/cameraErrors';

const RESOLUTION_PRESETS = [
    { label: '4K (UHD)', width: 3840, height: 2160 },
    { label: '1080p (FHD)', width: 1920, height: 1080 },
    { label: '720p (HD)', width: 1280, height: 720 },
    { label: '480p (SD)', width: 854, height: 480 } // Note: original was 854, task says 640
];

// New resolution ladder for retries on OverconstrainedError
const RESOLUTION_LADDER = [
  { width: 3840, height: 2160 }, // 4K
  { width: 1920, height: 1080 }, // 1080p
  { width: 1280, height: 720 },  // 720p
  { width: 640, height: 480 },   // 480p
];

const FPS_PRESETS = [240, 144, 120, 100, 60, 59.94, 50, 48, 30, 29.97, 25, 24, 23.98];

type StreamStatus = 'idle' | 'initializing' | 'streaming' | 'error';

// Updated return type with errorMessage and errorCode
export interface UseCameraStreamReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  deviceList: MediaDeviceInfo[];
  activeDeviceId: string;
  setActiveDeviceId: (id: string) => void;
  targetRes: { w: number; h: number };
  targetFps: number;
  applyFormat: (width: number, height: number, fps: number) => Promise<void>;
  streamReady: boolean;
  errorMessage: string | null;
  errorCode: CameraErrorCode | null;
  availableResolutions: { label: string; width: number; height: number }[];
  availableFps: number[];
  currentStream: MediaStream | null;
}

export const useCameraStream = (maxFrameRateCapability?: number, maxW?: number, maxH?: number): UseCameraStreamReturn => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [deviceList, setDeviceList] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = usePersistedState<string>('lumia_camera_id', '');
  const [targetRes, setTargetRes] = useState<{w: number, h: number}>({ 
    w: RESOLUTION_PRESETS[1]!.width, 
    h: RESOLUTION_PRESETS[1]!.height 
  }); 
  const [targetFps, setTargetFps] = useState<number>(30);
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<CameraErrorCode | null>(null);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);

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

  // Clear invalid device ID on mount
  useEffect(() => {
    if (!activeDeviceId) return;
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const cameras = devices.filter(d => d.kind === 'videoinput');
      if (cameras.length > 0 && !cameras.some(c => c.deviceId === activeDeviceId)) {
        setActiveDeviceId('');
      }
    });
  }, []); // Only run once on mount

  // Monitor device changes
  useEffect(() => {
      navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
      return () => navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
  }, [refreshDevices]);

  // Stream Initialization with Resolution Fallback
  useEffect(() => {
    let isMounted = true;
    let activeStream: MediaStream | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

    const startStream = async () => {
      // Wait for videoRef to be available
      if (!videoRef.current) {
        retryTimeout = setTimeout(() => {
          if (isMounted) startStream();
        }, 100);
        return;
      }
      if (status === 'initializing') return;

      setStatus('initializing');
      setErrorMessage(null);
      setErrorCode(null);

      let currentResolutionIndex = 0;
      let streamAttempted = false;

      while (!streamAttempted || currentResolutionIndex < RESOLUTION_LADDER.length) {
        const currentResolution = RESOLUTION_LADDER[currentResolutionIndex];
        if (!currentResolution) {
            console.error("[Camera] Invalid resolution index in RESOLUTION_LADDER.");
            setStatus('error');
            break;
        }
        const { width, height } = currentResolution;
        streamAttempted = true; // Mark that a stream attempt was made (before try)
        try {
          // Attempt to initialize camera with specific resolution constraints
          const stream = await cameraService.initialize(activeDeviceId || undefined, width, height);
          activeStream = stream;
          setCurrentStream(stream);

          if (!isMounted) {
            stream.getTracks().forEach(t => t.stop());
            return;
          }

          await refreshDevices();
          
          const settings = cameraService.getSettings();
          if (settings) {
            if (settings.deviceId) {
              setActiveDeviceId(prev => settings.deviceId || prev);
            }
            if (settings.width && settings.height) {
              setTargetRes(prev => ({ w: settings.width || prev.w, h: settings.height || prev.h }));
            }
            if (settings.frameRate) {
              console.log(`[Camera] Actual frame rate: ${settings.frameRate}fps`);
              const fps = settings.frameRate;
              const rounded = fps > 58 ? 60 : fps > 28 ? 30 : fps > 23 ? 24 : fps;
              setTargetFps(prev => rounded);
            }
          }

          if (!videoRef.current || !isMounted) return;
          videoRef.current.srcObject = stream;
          
          await new Promise<void>((resolve, reject) => {
            const video = videoRef.current;
            if (!video) return reject(new Error("Video element unmounted"));
            if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) return resolve();

            let timer: ReturnType<typeof setTimeout> | undefined;
            let raf: number | undefined;

            const cleanup = () => {
              if (timer) clearTimeout(timer);
              if (raf) cancelAnimationFrame(raf);
              video.removeEventListener('loadeddata', onReady);
              video.removeEventListener('canplay', onReady);
              video.removeEventListener('loadedmetadata', onReady);
            };

            const onReady = () => {
              cleanup();
              resolve();
            };

            const pollReady = () => {
              const trackLive = !!(video.srcObject as MediaStream | null)?.getVideoTracks().some(t => t.readyState === 'live');
              if (trackLive && video.videoWidth > 0 && video.videoHeight > 0) {
                onReady();
                return;
              }
              raf = requestAnimationFrame(pollReady);
            };

            video.addEventListener('loadeddata', onReady);
            video.addEventListener('canplay', onReady);
            video.addEventListener('loadedmetadata', onReady);
            pollReady();

            timer = setTimeout(() => {
              cleanup();
              const trackLive = !!(video.srcObject as MediaStream | null)?.getVideoTracks().some(t => t.readyState === 'live');
              if (trackLive || (video.videoWidth > 0 && video.videoHeight > 0)) {
                resolve();
              } else {
                reject(new Error("Camera initialization timed out"));
              }
            }, 10000);
          });

          if (!videoRef.current || !isMounted) return;
          await videoRef.current.play().catch(e => console.warn("Play interrupted", e));
          
          if (isMounted) setStatus('streaming');
          break; // Stream started successfully, exit loop

        } catch (err) {
          console.error(`Stream error at ${width}x${height}:`, err);
          const code = getCameraErrorCode(err);
          const message = getCameraErrorMessage(code);
          setErrorCode(code);
          setErrorMessage(message);

          if (code === CameraErrorCode.OVERCONSTRAINED) {
            currentResolutionIndex++;
            if (currentResolutionIndex < RESOLUTION_LADDER.length) {
              const nextRes = RESOLUTION_LADDER[currentResolutionIndex];
              if (nextRes) {
                console.warn(`[Camera] Overconstrained, trying next lower resolution: ${nextRes.width}x${nextRes.height}`);
              }
            } else {
              console.error("[Camera] All resolution fallbacks failed.");
              setStatus('error');
              break; // No more resolutions to try
            }
          } else {
            // Other errors are fatal for this attempt, no resolution fallback
            setStatus('error');
            break; 
          }
        }
      } // End while loop

      if (!activeStream && !streamAttempted) {
        // This case covers if the loop never ran or if there was an error before first attempt
        // e.g. RESOLUTION_LADDER is empty, or immediate permission denial without attempting stream
        setErrorCode(CameraErrorCode.UNKNOWN);
        setErrorMessage(getCameraErrorMessage(CameraErrorCode.UNKNOWN));
        setStatus('error');
      } else if (!activeStream && streamAttempted && status !== 'error') {
        // If attempts were made but no stream obtained and status isn't error,
        // it means all resolution fallbacks failed and error was set within the loop.
        // No additional action needed here.
      }
    };

    startStream();

    return () => {
      isMounted = false;
      if (retryTimeout) clearTimeout(retryTimeout);
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
      setCurrentStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [activeDeviceId]);

  const applyFormat = useCallback(async (width: number, height: number, fps: number) => {
      if (status !== 'streaming' || !cameraService.getSettings()) return;
      
      const clampedW = maxW ? Math.min(width, maxW) : width;
      const clampedH = maxH ? Math.min(height, maxH) : height;
      const clampedFps = maxFrameRateCapability ? Math.min(fps, maxFrameRateCapability) : fps;
      
      try {
          await cameraService.setFormat(clampedW, clampedH, clampedFps);
          setTargetRes(prev => ({ w: clampedW, h: clampedH }));
          setTargetFps(prev => clampedFps);
      } catch (e) {
          console.error("Failed to change format", e);
          const code = getCameraErrorCode(e);
          setErrorCode(code);
          setErrorMessage(getCameraErrorMessage(code));
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
    errorMessage,
    errorCode,
    availableResolutions,
    availableFps,
    currentStream, // Return the active stream
  };
};