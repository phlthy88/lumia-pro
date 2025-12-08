import React from 'react';
import { Box, Typography } from '@mui/material';
import { AIWidget } from './AIWidget';
import { ControlCard } from './controls/ControlCard';
import { MuiSlider } from './controls/MuiSlider';
import { MuiSwitch } from './controls/MuiToggle';
import { AnalysisResult } from '../services/AIAnalysisService';

interface AISettingsProps {
    result: AnalysisResult | null;
    isAnalyzing: boolean;
    onAnalyze: () => void;
    onAutoFix: () => void;
    onUndo: () => void;
    canUndo: boolean;
    beautyEnabled: boolean;
    setBeautyEnabled: (v: boolean) => void;
    beautySmooth: number;
    setBeautySmooth: (v: number) => void;
    hasFace: boolean;
}

export const AISettings: React.FC<AISettingsProps> = ({
    result,
    isAnalyzing,
    onAnalyze,
    onAutoFix,
    onUndo,
    canUndo,
    beautyEnabled,
    setBeautyEnabled,
    beautySmooth,
    setBeautySmooth,
    hasFace,
}) => {
    return (
        <>
            <AIWidget 
                result={result}
                isAnalyzing={isAnalyzing}
                onAnalyze={onAnalyze}
                onAutoFix={onAutoFix}
                onUndo={onUndo}
                canUndo={canUndo}
            />

            <ControlCard title="Beauty">
                <MuiSwitch 
                    label="Enable Beauty" 
                    checked={beautyEnabled} 
                    onChange={setBeautyEnabled} 
                />
                <MuiSlider 
                    label="Skin Smooth" 
                    value={beautySmooth} 
                    min={0} 
                    max={1} 
                    step={0.01} 
                    onChange={setBeautySmooth} 
                    disabled={!beautyEnabled}
                />
                {!hasFace && (
                    <Typography variant="caption" color="text.secondary">
                        Beauty will auto-disable until a face is detected.
                    </Typography>
                )}
            </ControlCard>
        </>
    );
};
