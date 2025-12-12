import React, { useState } from 'react';
import { Typography, TextField, Stack, Alert, Collapse, IconButton, Chip, Box, MenuItem } from '@mui/material';
import { ExpandMore, ExpandLess, Key, CheckCircle } from '@mui/icons-material';
import { AIWidget } from './AIWidget';
import { ControlCard } from './controls/ControlCard';
import { MuiSlider } from './controls/MuiSlider';
import { MuiSwitch } from './controls/MuiToggle';
import { AnalysisResult } from '../services/AIAnalysisService';
import { SceneAnalysis } from '../services/SceneDirectorService';
import { BeautyConfig } from '../types';
import { usePersistedState } from '../hooks/usePersistedState';

interface AISettingsProps {
    result: AnalysisResult | null;
    sceneAnalysis: SceneAnalysis | null;
    isAnalyzing: boolean;
    isSceneAnalyzing: boolean;
    onAnalyze: () => void;
    onSceneAnalyze: () => void;
    onAutoFix: () => void;
    onApplySceneAnalysis: () => void;
    onUndo: () => void;
    canUndo: boolean;
    beauty: BeautyConfig;
    setBeauty: React.Dispatch<React.SetStateAction<BeautyConfig>>;
    hasFace: boolean;
    onResetBeauty?: () => void;
    onAPIKeysChange: (keys: { openrouter?: string; openrouterModel?: string }) => void;
    visionEnabled: boolean;
    onToggleVision: (enabled: boolean) => void;
}

export const AISettings: React.FC<AISettingsProps> = ({
    result,
    sceneAnalysis,
    isAnalyzing,
    isSceneAnalyzing,
    onAnalyze,
    onSceneAnalyze,
    onAutoFix,
    onApplySceneAnalysis,
    onUndo,
    canUndo,
    beauty,
    setBeauty,
    hasFace,
    onResetBeauty,
    onAPIKeysChange,
    visionEnabled,
    onToggleVision,
}) => {
    const MODEL_OPTIONS = [
        { value: 'google/gemini-flash-1.5-8b', label: 'Gemini Flash 1.5 8B (free, vision)' },
        { value: 'meta-llama/llama-3.2-11b-vision-instruct', label: 'Llama 3.2 11B Vision (free)' },
        { value: 'mistralai/pixtral-12b', label: 'Pixtral 12B (vision)' },
    ];

    const [showAPIKeys, setShowAPIKeys] = useState(false);
    const [openrouterKey, setOpenrouterKey] = usePersistedState('lumia_api_openrouter', '');
    const [openrouterModel, setOpenrouterModel] = usePersistedState('lumia_api_openrouter_model', MODEL_OPTIONS[0]!.value);

    // Notify parent when keys change
    React.useEffect(() => {
        onAPIKeysChange({
            openrouter: openrouterKey || undefined,
            openrouterModel: openrouterModel || undefined,
        });
    }, [openrouterKey, openrouterModel, onAPIKeysChange]);

    const configuredProviders = [
        openrouterKey && 'OpenRouter',
    ].filter(Boolean);

    return (
        <>
            <AIWidget 
                result={result}
                sceneAnalysis={sceneAnalysis}
                isAnalyzing={isAnalyzing}
                isSceneAnalyzing={isSceneAnalyzing}
                onAnalyze={onAnalyze}
                onSceneAnalyze={onSceneAnalyze}
                onAutoFix={onAutoFix}
                onApplySceneAnalysis={onApplySceneAnalysis}
                onUndo={onUndo}
                canUndo={canUndo}
                hasExternalAI={configuredProviders.length > 0}
            />

            <ControlCard title="AI Providers">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Vision Worker</Typography>
                    <MuiSwitch label="Enable" checked={visionEnabled} onChange={onToggleVision} />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Key fontSize="small" />
                        <Typography variant="body2">
                            {configuredProviders.length > 0 
                                ? `${configuredProviders.length} provider${configuredProviders.length > 1 ? 's' : ''} configured`
                                : 'No API keys configured'}
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setShowAPIKeys(!showAPIKeys)}>
                        {showAPIKeys ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                </Box>

                {configuredProviders.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                        {configuredProviders.map(p => (
                            <Chip 
                                key={p} 
                                label={p} 
                                size="small" 
                                color="success" 
                                icon={<CheckCircle />}
                            />
                        ))}
                    </Box>
                )}

                <Collapse in={showAPIKeys}>
                    <Stack spacing={2} sx={{ mt: 2 }}>
                        <Alert severity="info" sx={{ fontSize: '0.75rem' }}>
                            Keys are stored locally in your browser and sent directly to providers. Never shared with us.
                        </Alert>
                        
                        <TextField 
                            label="OpenRouter API Key" 
                            type="password"
                            size="small"
                            value={openrouterKey}
                            onChange={(e) => setOpenrouterKey(e.target.value)}
                            helperText="Get a key at openrouter.ai (kept locally)"
                            fullWidth
                        />
                        
                        <TextField 
                            label="Model"
                            select
                            size="small"
                            value={openrouterModel}
                            onChange={(e) => setOpenrouterModel(e.target.value)}
                            helperText="Vision-capable, free-friendly choices"
                            fullWidth
                        >
                            {MODEL_OPTIONS.map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Stack>
                </Collapse>
            </ControlCard>

            <ControlCard title="Beauty" onReset={onResetBeauty}>
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
                <MuiSlider 
                    label="Background Blur" 
                    value={beauty.backgroundBlurStrength ?? 0} 
                    min={0} max={1} step={0.01} 
                    onChange={(v) => setBeauty(p => ({ ...p, backgroundBlurStrength: v }))} 
                />
                {!hasFace && beauty.enabled && (
                    <Typography variant="caption" color="text.secondary">
                        Beauty effects require face detection. Position yourself in frame.
                    </Typography>
                )}
            </ControlCard>
        </>
    );
};
