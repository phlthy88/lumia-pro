import React, { useState, useRef, useEffect } from 'react';
import { Box, useTheme, useMediaQuery, Slide, Grow, keyframes, IconButton } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { Navigation } from './NavigationRail';
import { ControlDrawer } from './ControlDrawer';

// M3 Emphasized Decelerate easing for entering elements
const m3EmphasizedDecelerate = 'cubic-bezier(0.05, 0.7, 0.1, 1.0)';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const spinReverse = keyframes`
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
`;

// M3 container transform animation
const m3ContainerIn = keyframes`
  0% { opacity: 0; transform: translateY(16px) scale(0.96); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;

const m3ContainerOut = keyframes`
  0% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-8px) scale(0.98); }
`;

interface AppLayoutProps {
    children: React.ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
    drawerContent: React.ReactNode;
    drawerTitle: string;
    rightPanelContent?: React.ReactNode;
    showRightPanel?: boolean;
    onDrawerScroll?: (scrollY: number) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
    children, 
    activeTab, 
    onTabChange, 
    drawerContent,
    drawerTitle,
    rightPanelContent,
    showRightPanel = false,
    onDrawerScroll
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [navOpen, setNavOpen] = useState(false);
    const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
    const [spinAnim, setSpinAnim] = useState<'none' | 'open' | 'close'>('none');

    const handleNavToggle = () => {
        setSpinAnim(navOpen ? 'close' : 'open');
        setNavOpen(!navOpen);
    };

    return (
        <Box sx={{ display: 'flex', height: '100dvh', width: '100vw', overflow: 'hidden', flexDirection: 'column' }}>
            
            {/* Accessibility: Skip to Content */}
            <Box
                component="a"
                href="#main-content"
                sx={{
                    position: 'absolute',
                    left: 16,
                    top: -100,
                    zIndex: 9999,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    p: 1,
                    borderRadius: 1,
                    transition: 'top 0.3s',
                    '&:focus': { top: 16 },
                    textDecoration: 'none',
                    fontWeight: 'bold'
                }}
            >
                Skip to Content
            </Box>

            {/* Main content area */}
            <Box sx={{ 
                display: 'flex', 
                flexGrow: 1, 
                overflow: 'hidden', 
                flexDirection: 'row',
                position: 'relative',
                minHeight: 0,
            }}>
                
                {/* Desktop: Control Drawer */}
                {!isMobile && (
                    <ControlDrawer key={activeTab} title={drawerTitle} onScroll={onDrawerScroll}>
                        {drawerContent}
                    </ControlDrawer>
                )}

                {/* Main viewfinder area - always rendered */}
                <Box sx={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                    minWidth: 0,
                    minHeight: 0,
                    overflow: 'hidden',
                    transition: 'padding 0.3s ease',
                    pr: !isMobile && navOpen ? '88px' : 0,
                }}>
                    <Box
                        id="main-content"
                        component="main"
                        tabIndex={-1} // Allow programmatic focus but not tab focus (unless content inside is focusable)
                        sx={{
                            flex: isMobile && mobileSettingsOpen ? '0 0 auto' : '1 1 0',
                            height: isMobile && mobileSettingsOpen ? 'calc(35dvh - 56px)' : '100%',
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: isMobile ? 1 : 2,
                            boxSizing: 'border-box',
                            transition: 'padding 0.3s ease',
                            outline: 'none', // Remove focus ring on container
                        }}
                    >
                        {/* Floating Settings Button - Inside viewfinder */}
                        {!isMobile && (
                            <IconButton
                                onClick={handleNavToggle}
                                sx={{
                                    position: 'absolute',
                                    top: 24,
                                    right: 24,
                                    zIndex: 70,
                                    bgcolor: navOpen ? theme.palette.primary.main : theme.palette.background.paper,
                                    color: navOpen ? theme.palette.primary.contrastText : theme.palette.text.primary,
                                    opacity: navOpen ? 1 : 0.6,
                                    boxShadow: theme.shadows[4],
                                    transition: 'opacity 0.3s ease, background-color 0.3s ease',
                                    animation: spinAnim === 'open' ? `${spin} 0.5s ease-out` : spinAnim === 'close' ? `${spinReverse} 0.5s ease-out` : 'none',
                                    '&:hover': {
                                        opacity: 1,
                                        bgcolor: navOpen ? theme.palette.primary.dark : theme.palette.action.hover,
                                    },
                                    '&:active': {
                                        transform: 'scale(0.95)',
                                    },
                                }}
                            >
                                <SettingsIcon />
                            </IconButton>
                        )}
                        {children}
                    </Box>

                    {/* Mobile Settings Panel with M3 transitions */}
                    <Slide direction="up" in={isMobile && mobileSettingsOpen} mountOnEnter unmountOnExit timeout={{ enter: 350, exit: 250 }} easing={{ enter: m3EmphasizedDecelerate, exit: 'cubic-bezier(0.3, 0, 0.8, 0.15)' }}>
                        <Box sx={{ 
                            height: 'calc(65dvh)',
                            bgcolor: theme.palette.background.paper,
                            borderTopLeftRadius: 16,
                            borderTopRightRadius: 16,
                            display: 'flex',
                            flexDirection: 'column',
                            flexShrink: 0,
                            overflow: 'hidden',
                            marginBottom: '-56px',
                            paddingBottom: '56px',
                        }}>
                            {/* Drag handle */}
                            <Box 
                                onClick={() => setMobileSettingsOpen(false)}
                                sx={{ 
                                    width: 40, 
                                    height: 4, 
                                    bgcolor: theme.palette.divider, 
                                    borderRadius: 2, 
                                    mx: 'auto', 
                                    mt: 1.5,
                                    mb: 1,
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                }} 
                            />
                            {/* Scrollable content */}
                            <Box 
                                key={activeTab}
                                onScroll={(e) => onDrawerScroll?.(e.currentTarget.scrollTop)}
                                sx={{ 
                                    px: 2, 
                                    pb: 2, 
                                    flex: 1, 
                                    overflow: 'auto',
                                    WebkitOverflowScrolling: 'touch',
                                    animation: `${m3ContainerIn} 300ms ${m3EmphasizedDecelerate}`,
                                }}>
                                {drawerContent}
                            </Box>
                        </Box>
                    </Slide>
                </Box>

                {/* Desktop: Right Panel for Media Library */}
                {!isMobile && (
                    <Slide direction="left" in={showRightPanel} mountOnEnter unmountOnExit>
                        <Box
                            sx={{
                                width: { sm: 320, md: 380 },
                                height: '100%',
                                bgcolor: theme.palette.background.paper,
                                borderLeft: `1px solid ${theme.palette.divider}`,
                                overflow: 'hidden',
                                flexShrink: 0,
                            }}
                        >
                            {rightPanelContent}
                        </Box>
                    </Slide>
                )}

                {/* Desktop: Navigation Rail dropdown */}
                {!isMobile && (
                    <Box 
                        sx={{ 
                            position: 'absolute', 
                            top: '50%', 
                            right: 16,
                            transform: 'translateY(-50%)',
                            zIndex: theme.zIndex.drawer + 3,
                        }}
                    >
                        <Grow 
                            in={navOpen} 
                            timeout={{ enter: 350, exit: 250 }}
                            style={{ transformOrigin: 'top right' }}
                            easing={{ enter: m3EmphasizedDecelerate, exit: 'cubic-bezier(0.3, 0, 0.8, 0.15)' }}
                        >
                            <Box>
                                <Navigation activeTab={activeTab} onTabChange={onTabChange} />
                            </Box>
                        </Grow>
                    </Box>
                )}
            </Box>

            {/* Mobile: Bottom Navigation */}
            {isMobile && (
                <Navigation activeTab={activeTab} onTabChange={(tab) => {
                    if (tab === activeTab) {
                        setMobileSettingsOpen(!mobileSettingsOpen);
                    } else {
                        onTabChange(tab);
                    }
                }} />
            )}
        </Box>
    );
};
