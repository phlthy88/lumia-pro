
import { useState, useCallback, useEffect } from 'react';
import { cameraService } from '../services/CameraControlService';
import { CameraCapabilities, HardwareState } from '../types';

export const useHardwareControls = (deviceId: string, streamReady: boolean = false) => {
    // We start with conservative defaults
    const [capabilities, setCapabilities] = useState<CameraCapabilities>({
        hasTorch: false,
        hasStabilization: false,
        hasFocus: false,
        hasExposure: false,
        hasExposureCompensation: false,
        hasWhiteBalance: false,
        hasZoom: false,
        minFocusDistance: 0,
        maxFocusDistance: 1,
        minExposureCompensation: -2,
        maxExposureCompensation: 2,
        minExposureDuration: 0,
        maxExposureDuration: 0,
        minIso: 100,
        maxIso: 800,
        maxFrameRate: 30,
    });

    const [hardware, setHardware] = useState<HardwareState>({
        torch: false,
        stabilization: false,
        focusMode: 'continuous',
        focusDistance: 0,
        exposureMode: 'continuous',
        shutterSpeed: 0,
        iso: 0,
        exposureCompensation: 0,
        whiteBalanceMode: 'continuous',
        colorTemperature: 0,
    });

    // Poll for capabilities when device changes or stream becomes ready
    useEffect(() => {
        if (!streamReady) return;
        
        const updateCaps = () => {
             const caps = cameraService.getCapabilities() as any;
             const settings = cameraService.getSettings() as any;
             
             if (caps) {
                 setCapabilities({
                     hasTorch: 'torch' in caps,
                     hasStabilization: 'imageStabilization' in caps || 'videoStabilizationMode' in caps,
                     hasFocus: 'focusMode' in caps,
                     hasExposure: 'exposureMode' in caps,
                     hasExposureCompensation: 'exposureCompensation' in caps,
                     hasWhiteBalance: 'whiteBalanceMode' in caps,
                     hasZoom: 'zoom' in caps,
                     minFocusDistance: caps.focusDistance?.min ?? 0,
                     maxFocusDistance: caps.focusDistance?.max ?? 1,
                     minExposureCompensation: caps.exposureCompensation?.min ?? -2,
                     maxExposureCompensation: caps.exposureCompensation?.max ?? 2,
                     minExposureDuration: caps.exposureTime?.min ?? 0,
                     maxExposureDuration: caps.exposureTime?.max ?? 0,
                     minIso: caps.iso?.min ?? 100,
                     maxIso: caps.iso?.max ?? 800,
                     maxFrameRate: caps.frameRate?.max,
                     maxWidth: caps.width?.max,
                     maxHeight: caps.height?.max
                 });
             }

             if (settings) {
                 setHardware(prev => ({
                     ...prev,
                     torch: settings.torch || false,
                     stabilization: false,
                     focusMode: settings.focusMode as any || 'continuous',
                     focusDistance: settings.focusDistance || 0,
                     exposureMode: settings.exposureMode as any || 'continuous',
                     shutterSpeed: settings.exposureTime || 0,
                     iso: settings.iso || 0,
                     exposureCompensation: settings.exposureCompensation || 0,
                     whiteBalanceMode: settings.whiteBalanceMode as any || 'continuous',
                     colorTemperature: settings.colorTemperature || 0
                 }));
             }
        };

        // Update immediately when stream is ready
        updateCaps();
    }, [deviceId, streamReady]);

    // Actions
    const toggleFocusMode = useCallback(async () => {
        const newMode = hardware.focusMode === 'continuous' ? 'manual' : 'continuous';
        setHardware(p => ({ ...p, focusMode: newMode }));
        await cameraService.setFocusMode(newMode);
    }, [hardware.focusMode]);

    const setFocusDistance = useCallback(async (dist: number) => {
        setHardware(p => ({ ...p, focusDistance: dist }));
        await cameraService.setFocusDistance(dist);
    }, []);

    const toggleExposureMode = useCallback(async () => {
        const newMode = hardware.exposureMode === 'continuous' ? 'manual' : 'continuous';
        setHardware(p => ({ ...p, exposureMode: newMode }));
        await cameraService.setExposureMode(newMode);
    }, [hardware.exposureMode]);

    const setShutterSpeed = useCallback(async (speed: number) => {
        setHardware(p => ({ ...p, shutterSpeed: speed }));
        // Speed is 1/x, so duration is 1000/speed ms usually, need to check API expectations
        // Assuming speed comes in as denominator (e.g. 60 for 1/60s)
        await cameraService.setExposureDuration(speed); 
    }, []);

    const setExposureCompensation = useCallback(async (ev: number) => {
        setHardware(p => ({ ...p, exposureCompensation: ev }));
        await cameraService.setExposureCompensation(ev);
    }, []);

    const toggleWhiteBalanceMode = useCallback(async () => {
        const newMode = hardware.whiteBalanceMode === 'continuous' ? 'manual' : 'continuous';
        setHardware(p => ({ ...p, whiteBalanceMode: newMode }));
        await cameraService.setWhiteBalanceMode(newMode);
    }, [hardware.whiteBalanceMode]);

    const setColorTemperature = useCallback(async (kelvin: number) => {
        setHardware(p => ({ ...p, colorTemperature: kelvin }));
        await cameraService.setColorTemperature(kelvin);
    }, []);

    const toggleStabilization = useCallback(async () => {
        // Not implemented in service yet properly
    }, []);

    const toggleTorch = useCallback(async (on: boolean) => {
        setHardware(p => ({ ...p, torch: on }));
        await cameraService.setTorch(on);
    }, []);

    return {
        capabilities,
        hardware,
        toggleFocusMode,
        setFocusDistance,
        toggleExposureMode,
        setShutterSpeed,
        setExposureCompensation,
        toggleWhiteBalanceMode,
        setColorTemperature,
        toggleStabilization,
        toggleTorch
    };
};
