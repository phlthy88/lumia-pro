import React from 'react';
import { Card, CardHeader, CardContent, IconButton, Collapse, useTheme } from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

interface ControlCardProps {
    title: string;
    children: React.ReactNode;
    defaultExpanded?: boolean;
}

export const ControlCard: React.FC<ControlCardProps> = ({ title, children, defaultExpanded = true }) => {
    const [expanded, setExpanded] = React.useState(defaultExpanded);
    const theme = useTheme();

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
