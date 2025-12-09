import React from 'react';
import { 
    Box,
    List, 
    ListItem, 
    ListItemButton, 
    ListItemIcon, 
    ListItemText, 
    Tooltip,
    useTheme,
    BottomNavigation,
    BottomNavigationAction,
    useMediaQuery
} from '@mui/material';
import {
    Tune as TuneIcon,
    Layers as LayersIcon,
    Settings as SettingsIcon,
    Palette as PaletteIcon,
    PhotoLibrary as MediaIcon,
    Bolt as BoostIcon,
    AutoAwesome as AIIcon,
    Speed as MetersIcon
} from '@mui/icons-material';

interface NavigationProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const NAV_ITEMS = [
    { id: 'ADJUST', label: 'Adjust', icon: <TuneIcon /> },
    { id: 'AI', label: 'AI', icon: <AIIcon /> },
    { id: 'OVERLAYS', label: 'Overlays', icon: <LayersIcon /> },
    { id: 'METERS', label: 'Meters', icon: <MetersIcon /> },
    { id: 'BOOSTS', label: 'Boosts', icon: <BoostIcon /> },
    { id: 'SYSTEM', label: 'System', icon: <SettingsIcon /> },
    { id: 'THEME', label: 'Theme', icon: <PaletteIcon /> },
    { id: 'MEDIA', label: 'Media', icon: <MediaIcon /> },
];

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    if (isMobile) {
        return (
            <BottomNavigation
                value={activeTab}
                onChange={(_, newValue) => onTabChange(newValue)}
                sx={{
                    width: '100%',
                    position: 'fixed',
                    bottom: 0,
                    zIndex: theme.zIndex.drawer + 2,
                    borderTop: `1px solid ${theme.palette.divider}`,
                    bgcolor: theme.palette.background.paper,
                }}
            >
                {NAV_ITEMS.map((item) => (
                    <BottomNavigationAction 
                        key={item.id} 
                        label={item.label} 
                        value={item.id} 
                        icon={item.icon} 
                    />
                ))}
            </BottomNavigation>
        );
    }

    // Vertical dropdown panel (same style as original rail)
    return (
        <Box
            sx={{
                width: 72,
                bgcolor: theme.palette.background.paper,
                borderRadius: '20px',
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: theme.shadows[8],
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 1.5,
            }}
        >
            <List sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }} role="tablist">
                {NAV_ITEMS.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <ListItem key={item.id} disablePadding sx={{ display: 'block', width: 'auto' }} role="presentation">
                             <Tooltip title={item.label} placement="left">
                                <ListItemButton
                                    onClick={() => onTabChange(item.id)}
                                    role="tab"
                                    aria-selected={isActive}
                                    aria-label={item.label}
                                    sx={{
                                        minHeight: 48,
                                        width: 48,
                                        justifyContent: 'center',
                                        flexDirection: 'column',
                                        borderRadius: '12px',
                                        backgroundColor: isActive ? theme.palette.secondary.container : 'transparent',
                                        color: isActive ? theme.palette.secondary.onContainer : theme.palette.text.secondary,
                                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                        transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                        '&:hover': {
                                             backgroundColor: isActive ? theme.palette.secondary.container : theme.palette.action.hover,
                                             transform: 'scale(1.08)',
                                        },
                                        '&:active': {
                                             transform: 'scale(0.95)',
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center', color: 'inherit' }}>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={item.label} 
                                        primaryTypographyProps={{ 
                                            variant: 'caption', 
                                            sx: { mt: 0.25, fontSize: '0.65rem', fontWeight: isActive ? 700 : 400 } 
                                        }} 
                                    />
                                </ListItemButton>
                            </Tooltip>
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );
};
