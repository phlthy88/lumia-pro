import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, useTheme, keyframes } from '@mui/material';
import { Videocam as LogoIcon, Settings as SettingsIcon, HelpOutline as HelpIcon } from '@mui/icons-material';

const spin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(180deg); }
`;

interface AppHeaderProps {
    title?: string;
    onMenuClick?: () => void;
    navOpen?: boolean;
    onNavToggle?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onMenuClick, navOpen, onNavToggle }) => {
    const theme = useTheme();

    return (
        <AppBar 
            position="static" 
            color="transparent" 
            elevation={0} 
            sx={{ 
                bgcolor: theme.palette.background.paper, 
                color: theme.palette.text.primary,
                boxShadow: 'none',
                zIndex: theme.zIndex.drawer + 3,
            }}
        >
            <Toolbar>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
                    <LogoIcon sx={{ color: theme.palette.primary.main, transition: 'color 0.3s ease' }} />
                    <Typography variant="h6" component="div" sx={{ fontWeight: 500 }}>
                        Lumia Pro Lens
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton color="inherit">
                        <HelpIcon />
                    </IconButton>
                    <IconButton 
                        color={navOpen ? 'primary' : 'inherit'} 
                        onClick={onNavToggle}
                        sx={{
                            transition: 'transform 0.3s ease',
                            animation: navOpen ? `${spin} 0.3s ease forwards` : 'none',
                        }}
                    >
                        <SettingsIcon />
                    </IconButton>
                </Box>
            </Toolbar>
        </AppBar>
    );
};
