import React from 'react';
import { Box, Typography } from '@mui/material';

export interface LowerThirdConfig {
  enabled: boolean;
  name: string;
  title: string;
  position: 'bottom-left' | 'bottom-right' | 'bottom-center';
  style: 'minimal' | 'boxed' | 'gradient';
  primaryColor: string;
  textColor: string;
}

export const DEFAULT_LOWER_THIRD: LowerThirdConfig = {
  enabled: false,
  name: '',
  title: '',
  position: 'bottom-left',
  style: 'minimal',
  primaryColor: '#6750A4',
  textColor: '#ffffff',
};

interface Props {
  config: LowerThirdConfig;
}

export const LowerThird: React.FC<Props> = ({ config }) => {
  if (!config.enabled || (!config.name && !config.title)) return null;

  const positionStyles = {
    'bottom-left': { left: 24, right: 'auto' },
    'bottom-right': { right: 24, left: 'auto' },
    'bottom-center': { left: '50%', transform: 'translateX(-50%)' },
  };

  const styleVariants = {
    minimal: {
      background: 'transparent',
      borderLeft: `3px solid ${config.primaryColor}`,
      paddingLeft: 12,
    },
    boxed: {
      background: config.primaryColor,
      borderRadius: 4,
      padding: '8px 16px',
    },
    gradient: {
      background: `linear-gradient(90deg, ${config.primaryColor} 0%, transparent 100%)`,
      padding: '8px 24px 8px 16px',
    },
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 24,
        ...positionStyles[config.position],
        ...styleVariants[config.style],
        color: config.textColor,
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      {config.name && (
        <Typography variant="subtitle1" fontWeight="bold" lineHeight={1.2}>
          {config.name}
        </Typography>
      )}
      {config.title && (
        <Typography variant="caption" sx={{ opacity: 0.9 }}>
          {config.title}
        </Typography>
      )}
    </Box>
  );
};
