import React from 'react';
import { Box, Typography, CircularProgress, Stack, useTheme, keyframes } from '@mui/material';
import { AutoFixHigh, Refresh, Undo } from '@mui/icons-material';
import { AnalysisResult } from '../services/AIAnalysisService';
import { MuiButton } from './controls/MuiButton';
import { ControlCard } from './controls/ControlCard';

const fadeIn = keyframes`
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
`;

const slideIn = keyframes`
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
`;

const spin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

interface AIWidgetProps {
    result: AnalysisResult | null;
    isAnalyzing: boolean;
    onAnalyze: () => void;
    onAutoFix: () => void;
    onUndo: () => void;
    canUndo: boolean;
}

const ScoreRing: React.FC<{ score: number; label: string; delay?: number }> = ({ score, label, delay = 0 }) => {
    const theme = useTheme();
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    
    let color = theme.palette.error.main;
    if (score > 50) color = theme.palette.warning.main;
    if (score > 80) color = theme.palette.success.main;

    return (
        <Stack 
            alignItems="center" 
            spacing={0.5}
            sx={{ 
                animation: `${fadeIn} 0.4s ease-out ${delay}ms both`,
            }}
        >
            <Box position="relative" width={48} height={48} display="flex" alignItems="center" justifyContent="center">
                <svg width="48" height="48" style={{ transform: 'rotate(-90deg)' }}>
                    <circle 
                        cx="24" cy="24" r={radius} 
                        stroke={theme.palette.divider} 
                        strokeWidth="4" 
                        fill="transparent" 
                    />
                    <circle 
                        cx="24" cy="24" r={radius} 
                        stroke={color} 
                        strokeWidth="4" 
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{
                            transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.3s ease',
                        }}
                    />
                </svg>
                <Typography 
                    variant="caption" 
                    fontWeight="bold" 
                    sx={{ position: 'absolute', transition: 'color 0.3s ease' }}
                >
                    {score}
                </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                {label}
            </Typography>
        </Stack>
    );
};

export const AIWidget: React.FC<AIWidgetProps> = ({ 
    result, isAnalyzing, onAnalyze, onAutoFix, onUndo, canUndo 
}) => {
    const theme = useTheme();

    return (
        <ControlCard title="AI Assistant">
            <Box sx={{ position: 'relative' }}>
                {/* Header Actions */}
                <Box display="flex" justifyContent="flex-end" mb={2}>
                    {canUndo && (
                        <MuiButton 
                            variant="text" 
                            size="small" 
                            startIcon={<Undo />} 
                            onClick={onUndo}
                            color="inherit"
                            sx={{ animation: `${fadeIn} 0.3s ease-out` }}
                        >
                            Undo
                        </MuiButton>
                    )}
                </Box>

                {/* Main Score Area */}
                {result ? (
                    <Stack direction="row" justifyContent="space-between" mb={2}>
                        <ScoreRing score={result.score.overall} label="Overall" delay={0} />
                        <ScoreRing score={result.score.exposure} label="Light" delay={100} />
                        <ScoreRing score={result.score.focus} label="Focus" delay={200} />
                        <ScoreRing score={result.score.composition} label="Frame" delay={300} />
                    </Stack>
                ) : (
                    <Typography variant="body2" color="text.secondary" align="center" py={2}>
                        Run analysis to see image quality scores.
                    </Typography>
                )}

                {/* Tips Section */}
                {result && result.tips.length > 0 && (
                    <Box 
                        sx={{ 
                            mb: 2, 
                            p: 1.5, 
                            borderRadius: 2, 
                            bgcolor: 'primary.container', 
                            color: 'primary.onContainer',
                            animation: `${fadeIn} 0.4s ease-out 0.3s both`,
                        }}
                    >
                        <Typography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                            SUGGESTIONS
                        </Typography>
                        <Stack spacing={0.5}>
                            {result.tips.map((tip, i) => (
                                <Box 
                                    key={i} 
                                    display="flex" 
                                    gap={1}
                                    sx={{ animation: `${slideIn} 0.3s ease-out ${400 + i * 100}ms both` }}
                                >
                                    <Typography variant="caption" fontWeight="bold">•</Typography>
                                    <Typography variant="caption">{tip}</Typography>
                                </Box>
                            ))}
                        </Stack>
                    </Box>
                )}

                {/* Actions */}
                <Stack direction="row" spacing={1}>
                    <Box flex={1}>
                        <MuiButton 
                            variant="outlined" 
                            onClick={onAnalyze} 
                            disabled={isAnalyzing}
                            fullWidth
                            startIcon={
                                <Refresh sx={{ 
                                    animation: isAnalyzing ? `${spin} 1s linear infinite` : 'none',
                                    transition: 'transform 0.2s ease',
                                }} />
                            }
                        >
                            {isAnalyzing ? "Scanning..." : "Analyze"}
                        </MuiButton>
                    </Box>
                    <Box flex={1}>
                        <MuiButton 
                            variant="contained" 
                            onClick={onAutoFix} 
                            disabled={!result}
                            fullWidth
                            startIcon={<AutoFixHigh />}
                        >
                            Auto Fix
                        </MuiButton>
                    </Box>
                </Stack>
                
                {/* Loading Overlay */}
                {isAnalyzing && (
                    <Box 
                        sx={{ 
                            position: 'absolute', 
                            inset: -16, 
                            bgcolor: 'rgba(0,0,0,0.7)', 
                            zIndex: 10,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1.5,
                            backdropFilter: 'blur(4px)',
                            borderRadius: 3,
                            animation: `${fadeIn} 0.2s ease-out`,
                        }}
                    >
                        <CircularProgress size={48} thickness={3} sx={{ color: 'primary.main' }} />
                        <Typography variant="caption" color="primary.main" fontWeight="bold" sx={{ animation: `${fadeIn} 0.3s ease-out 0.1s both` }}>
                            AI Analyzing Scene...
                        </Typography>
                    </Box>
                )}
            </Box>
        </ControlCard>
    );
};
