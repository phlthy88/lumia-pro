import React from 'react';
import { Typography } from '@mui/material';
import { AIWidget } from './AIWidget';
import { ControlCard } from './controls/ControlCard';
import { MuiSlider } from './controls/MuiSlider';
import { MuiSwitch } from './controls/MuiToggle';
import { AnalysisResult } from '../services/AIAnalysisService';
import { BeautyConfig } from '../types';

interface AISettingsProps {
    result: AnalysisResult | null;
    isAnalyzing: boolean;
    onAnalyze: () => void;
    onAutoFix: () => void;
    onUndo: () => void;
    canUndo: boolean;
    beauty: BeautyConfig;
    setBeauty: React.Dispatch<React.SetStateAction<BeautyConfig>>;
    hasFace: boolean;
}

export const AISettings: React.FC<AISettingsProps> = ({
    result,
    isAnalyzing,
    onAnalyze,
    onAutoFix,
    onUndo,
    canUndo,
    beauty,
    setBeauty,
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
                    checked={beauty.enabled} 
                    onChange={(v) => setBeauty(p => ({ ...p, enabled: v }))} 
                />
                <MuiSlider 
                    label="Skin Smooth" 
                    value={beauty.smooth} 
                    min={0} max={1} step={0.01} 
                    onChange={(v) => setBeauty(p => ({ ...p, smooth: v }))} 
                    disabled={!beauty.enabled}
                />
                <MuiSlider 
                    label="Eye Brighten" 
                    value={beauty.eyeBrighten} 
                    min={0} max={1} step={0.01} 
                    onChange={(v) => setBeauty(p => ({ ...p, eyeBrighten: v }))} 
                    disabled={!beauty.enabled}
                />
                <MuiSlider 
                    label="Face Slim" 
                    value={beauty.faceThin} 
                    min={0} max={1} step={0.01} 
                    onChange={(v) => setBeauty(p => ({ ...p, faceThin: v }))} 
                    disabled={!beauty.enabled}
                />
                <MuiSlider 
                    label="Cheekbones" 
                    value={beauty.cheekbones} 
                    min={0} max={1} step={0.01} 
                    onChange={(v) => setBeauty(p => ({ ...p, cheekbones: v }))} 
                    disabled={!beauty.enabled}
                />
                <MuiSlider 
                    label="Nose Slim" 
                    value={beauty.noseSlim} 
                    min={0} max={1} step={0.01} 
                    onChange={(v) => setBeauty(p => ({ ...p, noseSlim: v }))} 
                    disabled={!beauty.enabled}
                />
                <MuiSlider 
                    label="Lips Fuller" 
                    value={beauty.lipsFuller} 
                    min={0} max={1} step={0.01} 
                    onChange={(v) => setBeauty(p => ({ ...p, lipsFuller: v }))} 
                    disabled={!beauty.enabled}
                />
                <MuiSlider 
                    label="Skin Tone" 
                    value={beauty.skinTone} 
                    min={-0.5} max={0.5} step={0.01} 
                    onChange={(v) => setBeauty(p => ({ ...p, skinTone: v }))} 
                    disabled={!beauty.enabled}
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
