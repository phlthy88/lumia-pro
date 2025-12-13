import { useState, useCallback, useEffect, useRef } from 'react';
import { PTZCapabilities, PTZState, PTZMode } from '../types';
import { cameraService } from '../services/CameraControlService';

const DEFAULT_STATE: PTZState = {
    pan: 0, tilt: 0, zoom: 1,
    panSpeed: 0.5, tiltSpeed: 0.5, zoomSpeed: 0.5
};

// Calculate max pan/tilt allowed at given zoom to prevent black space
const getMaxOffset = (zoom: number): number => zoom > 1 ? (zoom - 1) / zoom : 0;

const clampToZoom = (value: number, zoom: number): number => {
    const max = getMaxOffset(zoom);
    return Math.max(-max, Math.min(max, value));
};

export const usePTZ = (streamReady: boolean) => {
    const [mode, setMode] = useState<PTZMode>('disabled');
    const [capabilities, setCapabilities] = useState<PTZCapabilities>({
        hasPan: false, hasTilt: false, hasZoom: false
    });
    const [state, setState] = useState<PTZState>(DEFAULT_STATE);
    const trackRef = useRef<MediaStreamTrack | null>(null);

    // Detect physical PTZ capabilities
    useEffect(() => {
        if (!streamReady) return;
        const caps = cameraService.getCapabilities() as any;
        if (!caps) return;

        const hasPan = 'pan' in caps;
        const hasTilt = 'tilt' in caps;
        const hasZoom = 'zoom' in caps;

        setCapabilities({
            hasPan, hasTilt, hasZoom,
            panRange: hasPan ? { min: caps.pan?.min ?? -180, max: caps.pan?.max ?? 180 } : undefined,
            tiltRange: hasTilt ? { min: caps.tilt?.min ?? -90, max: caps.tilt?.max ?? 90 } : undefined,
            zoomRange: hasZoom ? { min: caps.zoom?.min ?? 1, max: caps.zoom?.max ?? 10 } : undefined,
        });

        if (hasPan || hasTilt || hasZoom) {
            setMode('physical');
        }
    }, [streamReady]);

    const hasPhysicalPTZ = capabilities.hasPan || capabilities.hasTilt || capabilities.hasZoom;

    const applyPhysicalPTZ = useCallback(async (pan: number, tilt: number, zoom: number) => {
        const constraints: any = {};
        if (capabilities.hasPan) constraints.pan = pan;
        if (capabilities.hasTilt) constraints.tilt = tilt;
        if (capabilities.hasZoom) constraints.zoom = zoom;
        try {
            const track = trackRef.current;
            if (track) await track.applyConstraints({ advanced: [constraints] });
        } catch (e) {
            console.warn('[PTZ] Physical apply failed', e);
        }
    }, [capabilities]);

    const setPan = useCallback((value: number) => {
        setState(s => {
            const clamped = mode === 'virtual' ? clampToZoom(value, s.zoom) : value;
            if (mode === 'physical') applyPhysicalPTZ(clamped, s.tilt, s.zoom);
            return { ...s, pan: clamped };
        });
    }, [mode, applyPhysicalPTZ]);

    const setTilt = useCallback((value: number) => {
        setState(s => {
            const clamped = mode === 'virtual' ? clampToZoom(value, s.zoom) : value;
            if (mode === 'physical') applyPhysicalPTZ(s.pan, clamped, s.zoom);
            return { ...s, tilt: clamped };
        });
    }, [mode, applyPhysicalPTZ]);

    const setZoom = useCallback((value: number) => {
        setState(s => {
            // Re-clamp pan/tilt when zoom changes (in virtual mode)
            const newPan = mode === 'virtual' ? clampToZoom(s.pan, value) : s.pan;
            const newTilt = mode === 'virtual' ? clampToZoom(s.tilt, value) : s.tilt;
            if (mode === 'physical') applyPhysicalPTZ(newPan, newTilt, value);
            return { ...s, zoom: value, pan: newPan, tilt: newTilt };
        });
    }, [mode, applyPhysicalPTZ]);

    const setPanSpeed = useCallback((v: number) => setState(s => ({ ...s, panSpeed: v })), []);
    const setTiltSpeed = useCallback((v: number) => setState(s => ({ ...s, tiltSpeed: v })), []);
    const setZoomSpeed = useCallback((v: number) => setState(s => ({ ...s, zoomSpeed: v })), []);

    const resetPan = useCallback(() => setPan(0), [setPan]);
    const resetTilt = useCallback(() => setTilt(0), [setTilt]);
    const resetZoom = useCallback(() => setZoom(mode === 'physical' ? (capabilities.zoomRange?.min ?? 1) : 1), [setZoom, mode, capabilities]);

    // Joystick delta input (normalized -1 to 1)
    const applyJoystickDelta = useCallback((dx: number, dy: number) => {
        setState(s => {
            const maxOffset = mode === 'virtual' ? getMaxOffset(s.zoom) : 1;
            const panDelta = dx * s.panSpeed * 0.05;
            const tiltDelta = dy * s.tiltSpeed * 0.05;
            const newPan = Math.max(-maxOffset, Math.min(maxOffset, s.pan + panDelta));
            const newTilt = Math.max(-maxOffset, Math.min(maxOffset, s.tilt + tiltDelta));
            if (mode === 'physical') applyPhysicalPTZ(newPan, newTilt, s.zoom);
            return { ...s, pan: newPan, tilt: newTilt };
        });
    }, [mode, applyPhysicalPTZ]);

    return {
        mode, capabilities, state, hasPhysicalPTZ,
        enablePTZ: useCallback((preferPhysical = true) => setMode(preferPhysical && hasPhysicalPTZ ? 'physical' : 'virtual'), [hasPhysicalPTZ]),
        disablePTZ: useCallback(() => setMode('disabled'), []),
        setMode,
        setPan, setTilt, setZoom,
        setPanSpeed, setTiltSpeed, setZoomSpeed,
        resetPan, resetTilt, resetZoom,
        applyJoystickDelta
    };
};
