import React, { useId, useMemo } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';

interface MuiSelectProps {
    label: string;
    value: string | number;
    options: { value: string | number; label: string }[];
    onChange: (value: string) => void;
    disabled?: boolean;
}

export const MuiSelect: React.FC<MuiSelectProps> = ({ label, value, options, onChange, disabled }) => {
    const id = useId();
    const labelId = `${id}-label`;
    
    // Only use value if it exists in options, otherwise use empty string
    const safeValue = useMemo(() => {
        if (options.length === 0) return '';
        return options.some(opt => opt.value === value) ? value : '';
    }, [value, options]);
    
    return (
        <Box sx={{ minWidth: 120, mb: 2 }}>
            <FormControl fullWidth size="small" disabled={disabled}>
                <InputLabel id={labelId}>{label}</InputLabel>
                <Select
                    id={id}
                    labelId={labelId}
                    value={safeValue}
                    label={label}
                    onChange={(e) => onChange(e.target.value as string)}
                    sx={{
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main',
                            },
                        },
                    }}
                    MenuProps={{
                        PaperProps: {
                            sx: {
                                '& .MuiMenuItem-root': {
                                    transition: 'background-color 0.15s ease, transform 0.1s ease',
                                    '&:hover': {
                                        transform: 'translateX(4px)',
                                    },
                                },
                            },
                        },
                        TransitionProps: {
                            timeout: 200,
                        },
                    }}
                >
                    {options.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
};
