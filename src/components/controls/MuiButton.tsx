import React from 'react';
import { Button, SxProps, Theme } from '@mui/material';

interface ButtonProps {
    onClick: () => void;
    children: React.ReactNode;
    variant?: 'text' | 'outlined' | 'contained';
    color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
    disabled?: boolean;
    fullWidth?: boolean;
    startIcon?: React.ReactNode;
    size?: 'small' | 'medium' | 'large';
    sx?: SxProps<Theme>;
    ariaLabel?: string; // Explicit accessibility label
}

export const MuiButton: React.FC<ButtonProps> = ({ 
    onClick, children, variant = 'outlined', color = 'primary', disabled = false, fullWidth = false, startIcon, size = 'small', sx, ariaLabel
}) => {
    return (
        <Button 
            onClick={onClick} 
            variant={variant}
            color={color}
            disabled={disabled}
            fullWidth={fullWidth}
            startIcon={startIcon}
            size={size}
            sx={{
                textTransform: 'none',
                fontWeight: 600,
                ...sx
            }}
            aria-label={ariaLabel}
        >
            {children}
        </Button>
    );
};
