import React from 'react';
import { FormControlLabel, Switch, Typography, Box, ToggleButton, ToggleButtonGroup } from '@mui/material';

// Variant 1: Switch (for On/Off)
interface MuiSwitchProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

export const MuiSwitch: React.FC<MuiSwitchProps> = ({ label, checked, onChange, disabled }) => {
    return (
        <Box 
            sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                py: 1,
                transition: 'opacity 0.2s ease',
                opacity: disabled ? 0.5 : 1,
            }}
        >
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Switch 
                checked={checked} 
                onChange={(e) => onChange(e.target.checked)} 
                disabled={disabled}
                sx={{
                    '& .MuiSwitch-thumb': {
                        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease',
                    },
                    '& .MuiSwitch-track': {
                        transition: 'background-color 0.25s ease, opacity 0.25s ease',
                    },
                }}
            />
        </Box>
    );
};

// Variant 2: Toggle Group (for options like Render Mode)
interface MuiToggleGroupProps {
    label?: string;
    value: string;
    options: { value: string; label: string | React.ReactNode }[];
    onChange: (value: string) => void;
    exclusive?: boolean;
}

export const MuiToggleGroup: React.FC<MuiToggleGroupProps> = ({ label, value, options, onChange, exclusive = true }) => {
    return (
        <Box sx={{ width: '100%', mb: 2 }}>
            {label && <Typography variant="caption" color="text.secondary" display="block" mb={1}>{label}</Typography>}
            <ToggleButtonGroup
                value={value}
                exclusive={exclusive}
                onChange={(_, val) => { if(val !== null) onChange(val); }}
                fullWidth
                size="small"
                sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap',
                    gap: 0.5, // Small gap between all buttons
                    '& .MuiToggleButtonGroup-grouped': {
                        // Reset MUI's default border handling for grouped buttons
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: '12px !important', // Consistent rounded corners for all
                        margin: 0,
                        '&:not(:first-of-type)': {
                            borderLeft: '1px solid',
                            borderColor: 'divider',
                            marginLeft: 0,
                        },
                    },
                    '& .MuiToggleButton-root': {
                        flex: '1 1 auto',
                        minWidth: 'fit-content',
                        whiteSpace: 'nowrap',
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: '0.8125rem',
                        padding: '6px 16px',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        backgroundColor: 'transparent',
                        color: 'text.secondary',
                        '&:hover': {
                            backgroundColor: 'action.hover',
                            transform: 'translateY(-1px)',
                        },
                        '&.Mui-selected': {
                            backgroundColor: 'primary.container',
                            color: 'primary.onContainer',
                            borderColor: 'primary.main',
                            transform: 'scale(1.02)',
                            '&:hover': {
                                backgroundColor: 'primary.container',
                            },
                        },
                        '&:active': {
                            transform: 'scale(0.98)',
                        },
                    }
                }}
            >
                {options.map((opt) => (
                    <ToggleButton key={opt.value} value={opt.value}>
                        {opt.label}
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>
        </Box>
    );
};
