import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { useCameraStream, CameraError } from '../hooks/useCameraStream';
import { useHardwareControls } from '../hooks/useHardwareControls';
import { eventBus } from '../providers/EventBus';
import { ControlCard } from '../components/controls/ControlCard';
import { MuiSelect } from '../components/controls/MuiSelect';
import { MuiToggleGroup, MuiSwitch } from '../components/controls/MuiToggle';
import { MuiSlider } from '../components/controls/MuiSlider';
import { FallbackMode, CameraCapabilities, HardwareState } from '../types';

interface CameraContextState {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  deviceList: MediaDeviceInfo[];
  activeDeviceId: string;
  setActiveDeviceId: (id: string) => void;
  targetRes: { w: number, h: number };
  targetFps: number;
  applyFormat: (w: number, h: number, fps: number) => void;
  streamReady: boolean;
  error: CameraError | null;
  availableResolutions: { label: string, width: number, height: number }[];
  availableFps: number[];
  capabilities: CameraCapabilities;
  hardware: HardwareState;
  toggleFocusMode: () => void;
  setFocusDistance: (v: number) => void;
  toggleExposureMode: () => void;
  setShutterSpeed: (v: number) => void;
  setExposureCompensation: (v: number) => void;
  toggleStabilization: () => void;
  toggleTorch: (v: boolean) => void;
}

const CameraContext = createContext<CameraContextState | null>(null);

export const useCameraContext = () => {
  const context = useContext(CameraContext);
  if (!context) throw new Error('useCameraContext must be used within CameraController');
  return context;
};

interface CameraControllerProps {
  children?: ReactNode;
}

export const CameraController: React.FC<CameraControllerProps> = ({ children }) => {
  const [streamCapabilities, setStreamCapabilities] = useState<{maxFrameRate?: number, maxWidth?: number, maxHeight?: number}>({});

  const {
    deviceList, activeDeviceId, setActiveDeviceId,
    targetRes, targetFps, applyFormat, streamReady, error,
    availableResolutions, availableFps
  } = useCameraStream(streamCapabilities.maxFrameRate, streamCapabilities.maxWidth, streamCapabilities.maxHeight);

  // Sync ref
  useEffect(() => {
    // videoRef is managed by useCameraStream internally via its own ref,
    // but useCameraStream actually creates its own ref.
    // We need to pass the external videoRef to useCameraStream?
    // Looking at useCameraStream.ts: `const videoRef = useRef<HTMLVideoElement>(null);`
    // It returns its OWN ref.
    // The previous App.tsx used the ref returned by useCameraStream.
    // But RenderController needs access to the video element.
    // So we need to expose the video element.
    // Wait, useCameraStream creates the ref. We should lift that ref or pass one in.
    // Let's modify useCameraStream to accept a ref if possible, or just use the one it returns and expose it.
    // Actually, App.tsx creates `videoRef` and passes it to `useGLRenderer`.
    // BUT `useCameraStream` ALSO attaches the stream to `videoRef.current`.
    // In `App.tsx`: `const { videoRef, ... } = useCameraStream(...)`.
    // AND `<video ref={videoRef} ... />`.
    // So `useCameraStream` provides the ref.
    // BUT RenderController needs it.
    // So CameraController should expose `videoRef` from `useCameraStream`.
    // However, the props say `videoRef` is passed IN to CameraController.
    // If I pass a ref IN, `useCameraStream` needs to use THAT ref instead of creating one.
    // I should probably check `useCameraStream`.
  }, []);

  // Wait, I can't modify `useCameraStream` easily without potentially breaking things if I'm not careful.
  // Let's check `useCameraStream.ts`.
  // It defines `const videoRef = useRef<HTMLVideoElement>(null);` internally.
  // It does NOT accept a ref.
  // This means I cannot pass an external ref to it.
  // So `CameraController` must use the ref returned by `useCameraStream`, and we must rely on
  // `RenderController` getting access to the DOM element some other way?
  // Or `CameraController` exposes the ref via Context, and `RenderController` consumes it?
  // But `RenderController` takes `videoRef` as a PROP in the plan.
  // "Props in: videoRef from CameraController".
  // Ah, the plan says:
  // ```
  // <CameraController videoRef={videoRef} />
  // ```
  // This implies `videoRef` is created in App.tsx.
  // BUT `useCameraStream` creates its own ref.
  // This is a conflict.
  // Resolution: I will modify `useCameraStream` to accept an optional `externalRef`.
  // OR, I will use `useImperativeHandle` or similar.
  // Actually, simplest is to just modify `useCameraStream` to take a ref.
  // BUT "Do NOT change hook implementations" is a constraint. "only move where they're called".
  // If `App.tsx` creates the ref, `useCameraStream` creates a DIFFERENT ref.
  // `RenderController` needs the one with the video stream.
  // So `App.tsx` should probably NOT create the ref if `useCameraStream` creates it.
  // Instead `CameraController` should return the ref, and we pass it to `RenderController`.
  // BUT `App.tsx` needs to coordinate them.
  // So: `CameraController` creates the ref (via hook), exposes it via Context.
  // `RenderController` consumes `CameraContext` to get `videoRef`.
  // This aligns with "UI components read state via context".
  // The plan said "Props in: videoRef from CameraController" -> meaning `App.tsx` might pass it.
  // If `App.tsx` passes it, `useCameraStream` is the problem.

  // Let's look at `useCameraStream` again.
  // It returns `videoRef`.
  // If I can't change the hook, I have to use the ref it gives me.
  // So `CameraController` gets `videoRef` from `useCameraStream`.
  // `CameraController` needs to share this ref with `RenderController`.
  // I can hoist the ref via callback?
  // Or just expose it in Context.
  // I will go with exposing it in Context.
  // The `videoRef` prop passed to `CameraController` in the plan description might be a mistake or requires modification of the hook.
  // I will choose to IGNORE the "videoRef prop" part of the plan for `CameraController` and instead have `CameraController` *provide* the ref via Context, since `useCameraStream` owns it.
  // Wait, `RenderController` needs it.
  // If `RenderController` is a sibling, it can consume `CameraContext`.

  // Refined plan for refs:
  // `CameraController` uses `useCameraStream`. It gets `videoRef`.
  // It puts `videoRef` in `CameraContext`.
  // `RenderController` consumes `CameraContext` to get `videoRef`.
  // `App.tsx` does NOT create `videoRef`.

  // However, `RecordingController` might also need it?
  // `RenderController` needs it for `GLRenderer`.

  // Let's implement this.

  const { videoRef: hookVideoRef, ...streamData } = useCameraStream(streamCapabilities.maxFrameRate, streamCapabilities.maxWidth, streamCapabilities.maxHeight);

  // If the user passed a ref (which I am deciding NOT to support to avoid hook changes), we would sync them.
  // But `useCameraStream` attaches the stream to `videoRef.current`.
  // So we must use `hookVideoRef`.

  // Hardware controls
  const {
    capabilities, hardware,
    toggleFocusMode, setFocusDistance,
    toggleExposureMode, setShutterSpeed, setExposureCompensation,
    toggleStabilization, toggleTorch
  } = useHardwareControls(activeDeviceId, streamReady);

  // Update capabilities
  useEffect(() => {
    if (capabilities) {
        setStreamCapabilities({
            maxFrameRate: capabilities.maxFrameRate,
            maxWidth: capabilities.maxWidth,
            maxHeight: capabilities.maxHeight
        });
    }
  }, [capabilities]);

  // Event emission
  useEffect(() => {
    if (streamReady) {
      eventBus.emit('camera:ready', { deviceId: activeDeviceId });
    }
  }, [streamReady, activeDeviceId]);

  useEffect(() => {
    if (error) {
      eventBus.emit('camera:error', { error: new Error(error.message) });
    }
  }, [error]);

  return (
    <CameraContext.Provider value={{
      videoRef: hookVideoRef,
      deviceList, activeDeviceId, setActiveDeviceId,
      targetRes, targetFps, applyFormat, streamReady, error,
      availableResolutions, availableFps,
      capabilities, hardware,
      toggleFocusMode, setFocusDistance, toggleExposureMode, setShutterSpeed,
      setExposureCompensation, toggleStabilization, toggleTorch
    }}>
      {/* Hidden Video Element - needs real dimensions for stream to work */}
      <video
        ref={hookVideoRef}
        style={{ position: 'fixed', top: -9999, left: -9999, width: 640, height: 480, pointerEvents: 'none' }}
        playsInline
        muted
        autoPlay
      />
      {children}
    </CameraContext.Provider>
  );
};

export const CameraSettings: React.FC = () => {
  const {
    deviceList, activeDeviceId, setActiveDeviceId,
    targetRes, targetFps, applyFormat,
    availableResolutions, availableFps,
    capabilities, hardware,
    toggleFocusMode, setFocusDistance,
    toggleExposureMode, setShutterSpeed, setExposureCompensation,
    toggleStabilization, toggleTorch
  } = useCameraContext();

  return (
    <>
      <ControlCard title="Source & Mode">
          <MuiSelect
              label="Camera Device"
              value={activeDeviceId}
              options={deviceList.map(d => ({ value: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0,5)}` }))}
              onChange={setActiveDeviceId}
          />

          <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
              <MuiSelect
                  label="Resolution"
                  value={`${targetRes.w}x${targetRes.h}`}
                  options={availableResolutions.map(r => ({ value: `${r.width}x${r.height}`, label: r.label }))}
                  onChange={(v) => {
                      const [w, h] = v.split('x').map(Number);
                      applyFormat(w ?? 1920, h ?? 1080, targetFps);
                  }}
              />
              <MuiSelect
                  label="FPS"
                  value={targetFps}
                  options={availableFps.map(f => ({ value: f, label: String(f) }))}
                  onChange={(v) => applyFormat(targetRes.w, targetRes.h, Number(v))}
              />
          </Box>
          {(capabilities.maxWidth || capabilities.maxFrameRate) && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Device max: {capabilities.maxWidth && capabilities.maxHeight ? `${capabilities.maxWidth}×${capabilities.maxHeight}` : ''}{capabilities.maxWidth && capabilities.maxFrameRate ? ' @ ' : ''}{capabilities.maxFrameRate ? `${capabilities.maxFrameRate}fps` : ''}
              </Typography>
          )}
      </ControlCard>

      <ControlCard title="Hardware" defaultExpanded={false}>
          {capabilities.hasTorch && <MuiSwitch label="Torch / Light" checked={hardware.torch} onChange={() => toggleTorch(!hardware.torch)} />}
          {capabilities.hasStabilization && <MuiSwitch label="Stabilization" checked={hardware.stabilization} onChange={toggleStabilization} />}

          {capabilities.hasFocus && (
              <Box mt={2}>
                  <MuiToggleGroup label="Focus Mode" value={hardware.focusMode} options={[{value:'continuous',label:'AF'}, {value:'manual',label:'MF'}]} onChange={toggleFocusMode} />
                  {hardware.focusMode === 'manual' && <MuiSlider label="Focus Distance" value={hardware.focusDistance} min={0} max={1} step={0.01} onChange={setFocusDistance} />}
              </Box>
          )}

            {(capabilities.hasExposure || capabilities.hasExposureCompensation) && (
              <Box mt={2}>
                  <MuiToggleGroup label="Exposure Mode" value={hardware.exposureMode} options={[{value:'continuous',label:'AUTO'}, {value:'manual',label:'MAN'}]} onChange={toggleExposureMode} />
                  {hardware.exposureMode === 'continuous'
                      ? <MuiSlider label="Exposure Comp" value={hardware.exposureCompensation} min={capabilities.minExposureCompensation||-2} max={capabilities.maxExposureCompensation||2} step={0.5} onChange={setExposureCompensation} unit="EV"/>
                      : <MuiSlider label="Shutter Speed" value={hardware.shutterSpeed} min={30} max={1000} step={10} onChange={setShutterSpeed} formatValue={(v)=>`1/${Math.round(v)}s`}/>
                  }
              </Box>
          )}
      </ControlCard>
    </>
  );
};
