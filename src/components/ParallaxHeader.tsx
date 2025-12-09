import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

interface ParallaxHeaderProps {
    title: string;
    subtitle?: string;
    scrollY: number;
    height?: number;
}

export const ParallaxHeader: React.FC<ParallaxHeaderProps> = ({ 
    title, 
    subtitle, 
    scrollY, 
    height = 88 
}) => {
    const theme = useTheme();
    
    // M3 Large Top App Bar: exitUntilCollapsed behavior
    const collapsedHeight = 56;
    const expandedHeight = height;
    const scrollThreshold = expandedHeight - collapsedHeight;
    
    // Progress: 0 = expanded, 1 = collapsed
    const progress = Math.min(1, Math.max(0, scrollY / scrollThreshold));
    const currentHeight = expandedHeight - (scrollThreshold * progress);
    
    // M3 Typography scaling: Headline Medium -> Title Large
    const expandedFontSize = 1.5;
    const collapsedFontSize = 1.125;
    const fontSize = expandedFontSize - (expandedFontSize - collapsedFontSize) * progress;
    
    // Subtitle fades out at 50% scroll
    const subtitleOpacity = Math.max(0, 1 - progress * 2);
    
    // Background opacity increases as it collapses
    const bgOpacity = 0.2 + progress * 0.6;
    
    const isCollapsed = progress > 0.9;

    return (
        <Box
            sx={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                height: currentHeight,
                minHeight: collapsedHeight,
                overflow: 'hidden',
                borderRadius: isCollapsed ? 0 : 3,
                mb: 1.5,
                // Gradient background with theme colors
                background: `linear-gradient(135deg, ${theme.palette.primary.main}${Math.round(bgOpacity * 255).toString(16).padStart(2, '0')}, ${theme.palette.secondary.main}${Math.round(bgOpacity * 0.7 * 255).toString(16).padStart(2, '0')})`,
                backdropFilter: `blur(${progress * 8}px)`,
                boxShadow: isCollapsed ? `0 1px 3px ${theme.palette.divider}` : 'none',
                transition: 'box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
        >
            {/* Floating decorative shapes - fade out on collapse */}
            <Box
                sx={{
                    position: 'absolute',
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    background: `${theme.palette.primary.main}25`,
                    top: 8,
                    right: 16,
                    opacity: 1 - progress,
                    transform: `scale(${1 - progress * 0.5})`,
                    transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    pointerEvents: 'none',
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: `${theme.palette.secondary.main}20`,
                    top: 20,
                    right: 70,
                    opacity: 1 - progress,
                    transform: `scale(${1 - progress * 0.3})`,
                    transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    pointerEvents: 'none',
                }}
            />

            {/* Content container */}
            <Box
                sx={{
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    px: 2,
                }}
            >
                <Typography 
                    component="h2"
                    sx={{ 
                        fontSize: `${fontSize}rem`,
                        fontWeight: isCollapsed ? 500 : 600,
                        color: theme.palette.text.primary,
                        lineHeight: 1.2,
                        transition: 'font-size 0.2s cubic-bezier(0.4, 0, 0.2, 1), font-weight 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                >
                    {title}
                </Typography>
                {subtitle && (
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            color: theme.palette.text.secondary,
                            opacity: subtitleOpacity,
                            mt: 0.25,
                            fontSize: '0.75rem',
                            height: subtitleOpacity > 0 ? 'auto' : 0,
                            overflow: 'hidden',
                            transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    >
                        {subtitle}
                    </Typography>
                )}
            </Box>
        </Box>
    );
};
