import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { ControlCard } from './controls/ControlCard';
import { MuiSlider } from './controls/MuiSlider';
import { MuiButton } from './controls/MuiButton';
import { MuiSwitch } from './controls/MuiToggle';
import { PTZMode, PTZState, PTZCapabilities } from '../types';

interface Props {
    mode: PTZMode;
    state: PTZState;
    capabilities: PTZCapabilities;
    hasPhysicalPTZ: boolean;
    onModeChange: (mode: PTZMode) => void;
    onPanChange: (v: number) => void;
    onTiltChange: (v: number) => void;
    onZoomChange: (v: number) => void;
    onPanSpeedChange: (v: number) => void;
    onTiltSpeedChange: (v: number) => void;
    onZoomSpeedChange: (v: number) => void;
    onResetPan: () => void;
    onResetTilt: () => void;
    onResetZoom: () => void;
}

export const PTZPanel: React.FC<Props> = ({
    mode, state, capabilities: _capabilities, hasPhysicalPTZ,
    onModeChange, onPanChange, onTiltChange, onZoomChange,
    onPanSpeedChange, onTiltSpeedChange, onZoomSpeedChange,
    onResetPan, onResetTilt, onResetZoom
}) => {
    const isEnabled = mode !== 'disabled';
    const isPhysical = mode === 'physical';

    return (
        <ControlCard title="PTZ Control" onReset={() => { onResetPan(); onResetTilt(); onResetZoom(); }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <MuiSwitch
                    label="Enable PTZ"
                    checked={isEnabled}
                    onChange={() => onModeChange(isEnabled ? 'disabled' : (hasPhysicalPTZ ? 'physical' : 'virtual'))}
                />
                {isEnabled && (
                    <Chip
                        label={isPhysical ? 'Physical' : 'Virtual'}
                        size="small"
                        color={isPhysical ? 'secondary' : 'primary'}
                        onClick={() => onModeChange(isPhysical ? 'virtual' : (hasPhysicalPTZ ? 'physical' : 'virtual'))}
                        sx={{ cursor: hasPhysicalPTZ ? 'pointer' : 'default' }}
                    />
                )}
            </Box>

            {isEnabled && (
                <>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Position
                    </Typography>
                    <MuiSlider label="Pan" value={state.pan} min={-1} max={1} step={0.01} onChange={onPanChange} />
                    <MuiSlider label="Tilt" value={state.tilt} min={-1} max={1} step={0.01} onChange={onTiltChange} />
                    <MuiSlider label="Zoom" value={state.zoom} min={1} max={4} step={0.01} onChange={onZoomChange} unit="x" />

                    <Box sx={{ display: 'flex', gap: 1, my: 1 }}>
                        <MuiButton size="small" variant="outlined" onClick={onResetPan} sx={{ flex: 1 }}>Reset Pan</MuiButton>
                        <MuiButton size="small" variant="outlined" onClick={onResetTilt} sx={{ flex: 1 }}>Reset Tilt</MuiButton>
                        <MuiButton size="small" variant="outlined" onClick={onResetZoom} sx={{ flex: 1 }}>Reset Zoom</MuiButton>
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, mb: 1, display: 'block' }}>
                        Absolute Speeds
                    </Typography>
                    <MuiSlider label="Pan Speed" value={state.panSpeed} min={0.1} max={1} step={0.05} onChange={onPanSpeedChange} />
                    <MuiSlider label="Tilt Speed" value={state.tiltSpeed} min={0.1} max={1} step={0.05} onChange={onTiltSpeedChange} />
                    <MuiSlider label="Zoom Speed" value={state.zoomSpeed} min={0.1} max={1} step={0.05} onChange={onZoomSpeedChange} />
                </>
            )}
        </ControlCard>
    );
};
