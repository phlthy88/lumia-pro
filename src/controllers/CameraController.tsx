import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { useCameraStream, CameraError } from '../hooks/useCameraStream';
import { useHardwareControls } from '../hooks/useHardwareControls';
import { eventBus } from '../providers/EventBus';
import { ControlCard } from '../components/controls/ControlCard';
import { MuiSelect } from '../components/controls/MuiSelect';
import { MuiToggleGroup, MuiSwitch } from '../components/controls/MuiToggle';
import { MuiSlider } from '../components/controls/MuiSlider';
import { CameraCapabilities, HardwareState } from '../types';

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
    videoRef,
    deviceList, activeDeviceId, setActiveDeviceId,
    targetRes, targetFps, applyFormat, streamReady, error,
    availableResolutions, availableFps
  } = useCameraStream(streamCapabilities.maxFrameRate, streamCapabilities.maxWidth, streamCapabilities.maxHeight);

  // Single camera hook instance; its ref is shared via context so render/AI layers read the same stream.

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
      videoRef,
      deviceList, activeDeviceId, setActiveDeviceId,
      targetRes, targetFps, applyFormat, streamReady, error,
      availableResolutions, availableFps,
      capabilities, hardware,
      toggleFocusMode, setFocusDistance, toggleExposureMode, setShutterSpeed,
      setExposureCompensation, toggleStabilization, toggleTorch
    }}>
      {/* Hidden Video Element - needs real dimensions for stream to work */}
      <video
        ref={videoRef}
        style={{ position: 'fixed', inset: 0, width: 0, height: 0, pointerEvents: 'none', opacity: 0 }}
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
