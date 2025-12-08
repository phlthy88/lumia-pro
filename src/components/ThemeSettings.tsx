import React from 'react';
import { Box, Button, Typography, Stack, useTheme, Card, CardContent } from '@mui/material';
import { Upload as UploadIcon, Palette as PaletteIcon, DarkMode, LightMode } from '@mui/icons-material';
import { useAppTheme } from '../theme/ThemeContext';
import { ControlCard } from './controls/ControlCard';

export const ThemeSettings: React.FC = () => {
    const { mode, toggleMode, seedColor, setSeedColor, extractThemeFromImage, resetTheme } = useAppTheme();
    const theme = useTheme();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            extractThemeFromImage(e.target.files[0]);
        }
    };

    return (
        <Stack spacing={2}>
            <ControlCard title="Appearance Mode">
                 <Stack direction="row" spacing={1} justifyContent="center">
                    <Button 
                        variant={mode === 'light' ? 'contained' : 'outlined'} 
                        startIcon={<LightMode />} 
                        onClick={() => mode !== 'light' && toggleMode()}
                        fullWidth
                    >
                        Light
                    </Button>
                    <Button 
                        variant={mode === 'dark' ? 'contained' : 'outlined'} 
                        startIcon={<DarkMode />} 
                        onClick={() => mode !== 'dark' && toggleMode()}
                        fullWidth
                    >
                        Dark
                    </Button>
                 </Stack>
            </ControlCard>

            <ControlCard title="Dynamic Color">
                <Typography variant="body2" color="text.secondary" paragraph>
                    Material Design 3 generates a tonal palette from a single seed color.
                </Typography>
                
                <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                    <Box 
                        sx={{ 
                            width: 48, 
                            height: 48, 
                            borderRadius: '50%', 
                            bgcolor: seedColor, 
                            border: `2px solid ${theme.palette.divider}`,
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <input 
                            id="seed-color-picker"
                            type="color" 
                            value={seedColor} 
                            onChange={(e) => setSeedColor(e.target.value)}
                            aria-label="Pick seed color"
                            style={{ 
                                opacity: 0, 
                                position: 'absolute', 
                                top: 0, 
                                left: 0, 
                                width: '100%', 
                                height: '100%', 
                                cursor: 'pointer' 
                            }} 
                        />
                    </Box>
                    <Box>
                         <Typography variant="caption" display="block">Current Seed</Typography>
                         <Typography variant="body2" fontFamily="monospace">{seedColor}</Typography>
                    </Box>
                </Stack>

                <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                    fullWidth
                    sx={{ mb: 2 }}
                >
                    Pick from Image
                    <input
                        id="theme-image-upload"
                        type="file"
                        hidden
                        accept="image/*"
                        aria-label="Upload image for color extraction"
                        onChange={handleFileUpload}
                    />
                </Button>

                <Button 
                    color="error" 
                    size="small" 
                    onClick={resetTheme}
                    fullWidth
                >
                    Reset to Default
                </Button>
            </ControlCard>

            <ControlCard title="Preview">
                 <Stack spacing={1}>
                    <Box sx={{ p: 2, bgcolor: 'primary.container', color: 'primary.onContainer', borderRadius: 2 }}>
                        Primary Container
                    </Box>
                    <Box sx={{ p: 2, bgcolor: 'secondary.container', color: 'secondary.onContainer', borderRadius: 2 }}>
                        Secondary Container
                    </Box>
                    <Box sx={{ p: 2, bgcolor: 'tertiary.container', color: 'tertiary.onContainer', borderRadius: 2 }}>
                        Tertiary Container
                    </Box>
                    <Box sx={{ p: 2, bgcolor: 'background.surfaceContainerHigh', color: 'text.primary', borderRadius: 2 }}>
                        Surface Container High
                    </Box>
                 </Stack>
            </ControlCard>
        </Stack>
    );
};
