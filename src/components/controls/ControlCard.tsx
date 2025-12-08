import React, { useState } from 'react';
import { Card, CardHeader, CardContent, IconButton, Collapse, useTheme, Box, keyframes } from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Refresh as RefreshIcon } from '@mui/icons-material';

const spin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

interface ControlCardProps {
    title: string;
    children: React.ReactNode;
    defaultExpanded?: boolean;
    onReset?: () => void;
}

export const ControlCard: React.FC<ControlCardProps> = ({ title, children, defaultExpanded = true, onReset }) => {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const [spinning, setSpinning] = useState(false);
    const theme = useTheme();

    const handleReset = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onReset) {
            setSpinning(true);
            onReset();
            setTimeout(() => setSpinning(false), 500);
        }
    };

    return (
        <Card 
            variant="outlined" 
            sx={{ 
                mb: 2, 
                overflow: 'visible',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    borderColor: theme.palette.primary.main,
                    boxShadow: `0 0 0 1px ${theme.palette.primary.main}20`,
                }
            }}
        >
            <CardHeader
                title={title}
                titleTypographyProps={{ variant: 'subtitle2', fontWeight: 'bold' }}
                action={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {onReset && (
                            <IconButton
                                onClick={handleReset}
                                aria-label="reset"
                                size="small"
                                sx={{ 
                                    mr: 0.5,
                                    animation: spinning ? `${spin} 0.5s ease-out` : 'none',
                                    color: theme.palette.text.secondary,
                                    '&:hover': { color: theme.palette.primary.main }
                                }}
                            >
                                <RefreshIcon fontSize="small" />
                            </IconButton>
                        )}
                        <IconButton
                            onClick={() => setExpanded(!expanded)}
                            aria-expanded={expanded}
                            aria-label="show more"
                            size="small"
                            sx={{ 
                                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', 
                                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                        >
                            <ExpandMoreIcon />
                        </IconButton>
                    </Box>
                }
                sx={{ 
                    py: 1, 
                    px: 2, 
                    bgcolor: 'action.hover',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                    '&:hover': {
                        bgcolor: 'action.selected',
                    }
                }}
                onClick={() => setExpanded(!expanded)}
            />
            <Collapse in={expanded} timeout={300} easing="cubic-bezier(0.4, 0, 0.2, 1)">
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    {children}
                </CardContent>
            </Collapse>
        </Card>
    );
};
