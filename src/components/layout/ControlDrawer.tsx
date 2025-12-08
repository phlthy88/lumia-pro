import React, { useCallback, useState, useRef } from 'react';
import { Box, Paper, Typography, useTheme, useMediaQuery, SwipeableDrawer, keyframes } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

// M3 Expressive Shared Z-Axis: Spring-based entrance with overshoot
const expressiveZAxisIn = keyframes`
    0% { 
        opacity: 0; 
        transform: scale(0.92) translateZ(-40px);
    }
    70% {
        opacity: 1;
        transform: scale(1.02) translateZ(5px);
    }
    85% {
        transform: scale(0.99) translateZ(-2px);
    }
    100% { 
        opacity: 1; 
        transform: scale(1) translateZ(0);
    }
`;

const conveyorDown = keyframes`
    0% { background-position: 0 0; }
    100% { background-position: 0 40px; }
`;

const conveyorUp = keyframes`
    0% { background-position: 0 0; }
    100% { background-position: 0 -40px; }
`;

interface ControlDrawerProps {
    title: string;
    children: React.ReactNode;
    onScroll?: (scrollY: number) => void;
}

export const ControlDrawer: React.FC<ControlDrawerProps> = ({ title, children, onScroll }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [showTopFade, setShowTopFade] = useState(false);
    const [showBottomFade, setShowBottomFade] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        onScroll?.(scrollTop);
        setShowTopFade(scrollTop > 20);
        setShowBottomFade(scrollTop < scrollHeight - clientHeight - 20);
    }, [onScroll]);

    const toggleDrawer = (newOpen: boolean) => () => {
        setMobileOpen(newOpen);
    };

    const primaryAlpha = theme.palette.primary.main + '15';
    const bgColor = theme.palette.background.default;

    const ScrollFades = () => (
        <>
            {/* Top conveyor fade */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 6,
                    height: 50,
                    background: `linear-gradient(to bottom, ${bgColor} 0%, ${bgColor} 20%, transparent 100%)`,
                    pointerEvents: 'none',
                    zIndex: 2,
                    opacity: showTopFade ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        background: `repeating-linear-gradient(
                            180deg,
                            ${primaryAlpha} 0px,
                            transparent 2px,
                            transparent 8px
                        )`,
                        backgroundSize: '100% 40px',
                        animation: `${conveyorDown} 0.8s linear infinite`,
                        opacity: 0.6,
                        maskImage: 'linear-gradient(to bottom, black, transparent)',
                    },
                }}
            />
            {/* Bottom conveyor fade */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 6,
                    height: 50,
                    background: `linear-gradient(to top, ${bgColor} 0%, ${bgColor} 20%, transparent 100%)`,
                    pointerEvents: 'none',
                    zIndex: 2,
                    opacity: showBottomFade ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        background: `repeating-linear-gradient(
                            180deg,
                            ${primaryAlpha} 0px,
                            transparent 2px,
                            transparent 8px
                        )`,
                        backgroundSize: '100% 40px',
                        animation: `${conveyorUp} 0.8s linear infinite`,
                        opacity: 0.6,
                        maskImage: 'linear-gradient(to top, black, transparent)',
                    },
                }}
            />
        </>
    );

    if (isMobile) {
        const drawerBleeding = 56;

        return (
            <>
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 56,
                        left: 0,
                        right: 0,
                        height: drawerBleeding,
                        bgcolor: theme.palette.background.paper,
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: theme.zIndex.drawer + 1,
                        boxShadow: '0px -2px 10px rgba(0,0,0,0.2)',
                        cursor: 'pointer'
                    }}
                    onClick={toggleDrawer(true)}
                >
                     <Box sx={{ width: 30, height: 4, bgcolor: theme.palette.divider, borderRadius: 2, position: 'absolute', top: 8 }} />
                     <Typography variant="subtitle2" sx={{ mt: 1 }}>{title}</Typography>
                     <ExpandLess sx={{ position: 'absolute', right: 16 }} />
                </Box>

                <SwipeableDrawer
                    anchor="bottom"
                    open={mobileOpen}
                    onClose={toggleDrawer(false)}
                    onOpen={toggleDrawer(true)}
                    swipeAreaWidth={drawerBleeding}
                    disableSwipeToOpen={false}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        '& .MuiDrawer-paper': {
                            height: 'calc(80% - 56px)',
                            overflow: 'visible',
                            borderTopLeftRadius: 16,
                            borderTopRightRadius: 16,
                        },
                    }}
                >
                    <Box
                         sx={{
                            position: 'absolute',
                            top: -drawerBleeding,
                            borderTopLeftRadius: 8,
                            borderTopRightRadius: 8,
                            visibility: 'visible',
                            right: 0,
                            left: 0,
                            bgcolor: theme.palette.background.paper,
                            height: drawerBleeding,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                        onClick={toggleDrawer(false)}
                    >
                        <Box sx={{ width: 30, height: 4, bgcolor: theme.palette.divider, borderRadius: 2, position: 'absolute', top: 8 }} />
                        <Typography variant="subtitle2" sx={{ mt: 1 }}>{title}</Typography>
                        <ExpandMore sx={{ position: 'absolute', right: 16 }} />
                    </Box>
                    <Box sx={{ position: 'relative', height: '100%' }}>
                        <ScrollFades />
                        <Box 
                            ref={scrollRef}
                            onScroll={handleScroll}
                            sx={{ px: 2, pb: 2, height: '100%', overflow: 'auto', WebkitOverflowScrolling: 'touch' }}
                        >
                            {children}
                        </Box>
                    </Box>
                </SwipeableDrawer>
            </>
        );
    }

    return (
        <Paper
            elevation={8}
            sx={{
                width: 360,
                height: 'calc(100% - 16px)',
                m: 1,
                mr: 0,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: theme.palette.background.default,
                zIndex: theme.zIndex.drawer + 1,
                overflow: 'hidden',
                borderRadius: 0.75,
                animation: `${expressiveZAxisIn} 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)`,
                transformStyle: 'preserve-3d',
                perspective: 1000,
            }}
        >
            <Box sx={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
                <ScrollFades />
                <Box 
                    ref={scrollRef}
                    onScroll={handleScroll}
                    sx={{ 
                        height: '100%',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        p: 2,
                        scrollBehavior: 'smooth',
                        direction: 'rtl',
                        '& > *': { direction: 'ltr' },
                        '&::-webkit-scrollbar': { 
                            width: '8px',
                        },
                        '&::-webkit-scrollbar-track': { 
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '4px',
                            boxShadow: 'inset 0 0 6px rgba(0,0,0,0.3)',
                        },
                        '&::-webkit-scrollbar-thumb': { 
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.3), rgba(255,255,255,0.2))',
                            borderRadius: '4px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                            border: '1px solid rgba(255,255,255,0.1)',
                        },
                        '&::-webkit-scrollbar-thumb:hover': { 
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.4), rgba(255,255,255,0.3))',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)',
                        },
                    }}
                >
                    {children}
                </Box>
            </Box>
        </Paper>
    );
};
