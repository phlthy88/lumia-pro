import React, { useId } from 'react';
import { Slider, Box, Typography, Stack } from '@mui/material';

interface MuiSliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (val: number) => void;
    unit?: string;
    formatValue?: (val: number) => string;
    disabled?: boolean;
}

export const MuiSlider: React.FC<MuiSliderProps> = ({ 
    label, value, min, max, step = 1, onChange, unit, formatValue, disabled 
}) => {
    const id = useId();
    const labelId = `${id}-label`;
    const displayValue = formatValue ? formatValue(value) : (unit ? `${value}${unit}` : value);

    return (
        <Box 
            sx={{ 
                width: '100%', 
                mb: 1,
                transition: 'opacity 0.2s ease',
                opacity: disabled ? 0.5 : 1,
            }}
        >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography id={labelId} variant="body2" color="text.secondary">{label}</Typography>
                <Typography 
                    variant="caption" 
                    fontWeight="bold" 
                    color="primary"
                    sx={{
                        transition: 'transform 0.15s ease',
                        display: 'inline-block',
                        '&:hover': { transform: 'scale(1.1)' }
                    }}
                >
                    {displayValue}
                </Typography>
            </Stack>
            <Slider
                id={id}
                value={value}
                min={min}
                max={max}
                step={step}
                onChange={(_, val) => onChange(val as number)}
                disabled={disabled}
                size="small"
                valueLabelDisplay="auto"
                aria-labelledby={labelId}
                sx={{ 
                    py: 1,
                    '& .MuiSlider-thumb': {
                        transition: 'transform 0.15s ease, box-shadow 0.2s ease',
                        '&:hover': { transform: 'scale(1.2)' },
                        '&:active': { transform: 'scale(1.3)' },
                    },
                    '& .MuiSlider-track': {
                        transition: 'width 0.1s ease',
                    },
                }}
            />
        </Box>
    );
};
