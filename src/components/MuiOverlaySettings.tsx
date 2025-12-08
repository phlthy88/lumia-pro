import React from 'react';
import { Stack, Card, Typography, Box } from '@mui/material';
import { MuiToggleGroup, MuiSwitch } from './controls/MuiToggle';
import { MuiSelect } from './controls/MuiSelect';
import { ControlCard } from './controls/ControlCard';
import { GridType, AspectRatio, OverlayConfig } from '../types';

interface OverlaySettingsProps {
    config: OverlayConfig;
    setConfig: React.Dispatch<React.SetStateAction<OverlayConfig>>;
}

export const MuiOverlaySettings: React.FC<OverlaySettingsProps> = ({ config, setConfig }) => {
    
    const gridOptions = Object.values(GridType).map(type => ({
        value: type,
        label: type.replace('Rule of ', '')
    }));

    const ratioOptions = Object.values(AspectRatio).map(ar => ({
        value: ar,
        label: ar
    }));

    return (
        <Stack spacing={2}>
            <ControlCard title="Guides & Grids">
                <MuiToggleGroup
                    label="Grid Type"
                    value={config.grid}
                    options={gridOptions}
                    onChange={(val) => setConfig(p => ({ ...p, grid: val as GridType }))}
                />
            </ControlCard>

            <ControlCard title="Cinema Mask">
                <MuiSelect
                    label="Aspect Ratio"
                    value={config.aspectRatio}
                    options={ratioOptions}
                    onChange={(val) => setConfig(p => ({ ...p, aspectRatio: val as AspectRatio }))}
                />
            </ControlCard>

            <ControlCard title="Broadcast Tools">
                <MuiSwitch 
                    label="Safe Areas (90/80%)"
                    checked={config.safeArea}
                    onChange={(checked) => setConfig(p => ({ ...p, safeArea: checked }))}
                />
                <MuiSwitch 
                    label="SMPTE Timecode"
                    checked={config.timecode}
                    onChange={(checked) => setConfig(p => ({ ...p, timecode: checked }))}
                />
            </ControlCard>
        </Stack>
    );
};
