import React, { useId, useCallback } from 'react';
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

    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (disabled) return;

        let newValue = value;
        // Fine-tuning with arrow keys
        if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
            newValue = Math.min(max, value + step);
            event.preventDefault(); // Prevent page scroll
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
            newValue = Math.max(min, value - step);
            event.preventDefault();
        }

        if (newValue !== value) {
            onChange(Number(newValue.toFixed(4))); // Avoid float precision issues
        }
    }, [value, max, min, step, onChange, disabled]);

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
                    aria-label={`Current value: ${displayValue}`}
                    role="status"
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
                onKeyDown={handleKeyDown}
                disabled={disabled}
                size="small"
                valueLabelDisplay="auto"
                aria-labelledby={labelId}
                aria-valuetext={String(displayValue)}
                sx={{ 
                    py: 1,
                    '& .MuiSlider-thumb': {
                        transition: 'transform 0.15s ease, box-shadow 0.2s ease',
                        '&:hover': { transform: 'scale(1.2)' },
                        '&:active': { transform: 'scale(1.3)' },
                        '&:focus-visible': {
                            boxShadow: `0 0 0 8px rgba(25, 118, 210, 0.16)`
                        }
                    },
                    '& .MuiSlider-track': {
                        transition: 'width 0.1s ease',
                    },
                }}
            />
        </Box>
    );
};
