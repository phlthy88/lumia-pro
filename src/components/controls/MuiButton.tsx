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
}

export const MuiButton: React.FC<ButtonProps> = ({ 
    onClick, children, variant = 'outlined', color = 'primary', disabled = false, fullWidth = false, startIcon, size = 'small', sx
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
            sx={sx}
        >
            {children}
        </Button>
    );
};
