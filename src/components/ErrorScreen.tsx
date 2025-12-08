import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import {
  VideocamOff,
  BrokenImage,
  SignalWifiOff,
  Memory,
  ErrorOutline,
  Videocam
} from '@mui/icons-material';
import { FallbackMode } from '../types';

interface ErrorScreenProps {
  mode: FallbackMode;
  onRetry?: () => void;
  message?: string;
}

const ERROR_CONFIG: Record<FallbackMode, { icon: React.ElementType, title: string, description: string, action?: string }> = {
  [FallbackMode.GL_UNSUPPORTED]: {
    icon: BrokenImage,
    title: 'Graphics Not Supported',
    description: 'Your browser or device does not support WebGL 2.0, which is required for the studio engine.',
    action: 'Learn More'
  },
  [FallbackMode.CAMERA_DENIED]: {
    icon: VideocamOff,
    title: 'Camera Access Denied',
    description: 'Please enable camera permissions in your browser settings to use the studio.',
    action: 'Open Settings'
  },
  [FallbackMode.CAMERA_NOT_FOUND]: {
    icon: Videocam,
    title: 'No Camera Found',
    description: 'We could not detect a camera on your device. Please connect one and reload.',
    action: 'Check Connection'
  },
  [FallbackMode.MEDIAPIPE_FAILED]: {
    icon: Memory,
    title: 'AI Engine Error',
    description: 'The computer vision engine failed to initialize. Reloading usually fixes this.',
    action: 'Reload Engine'
  },
  [FallbackMode.RECORDING_FAILED]: {
    icon: ErrorOutline,
    title: 'Recording Error',
    description: 'We could not start the recording. This might be due to a codec issue.',
    action: 'Try Again'
  },
  [FallbackMode.NETWORK_OFFLINE]: {
    icon: SignalWifiOff,
    title: 'You are Offline',
    description: 'An internet connection is required to load initial resources.',
    action: 'Retry Connection'
  },
  [FallbackMode.GENERIC_ERROR]: {
    icon: ErrorOutline,
    title: 'Something went wrong',
    description: 'The application encountered an unexpected error.',
    action: 'Reload Application'
  }
};

export const ErrorScreen: React.FC<ErrorScreenProps> = ({ mode, onRetry, message }) => {
  const config = ERROR_CONFIG[mode];
  const Icon = config.icon;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        bgcolor: 'background.default',
        p: 2
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 400,
          textAlign: 'center',
          borderRadius: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}
      >
        <Icon sx={{ fontSize: 64, color: 'error.main' }} />

        <Box>
            <Typography variant="h5" gutterBottom fontWeight="bold">
            {config.title}
            </Typography>
            <Typography variant="body1" color="text.secondary">
            {config.description}
            </Typography>
        </Box>

        {message && (
             <Box sx={{ mt: 1, p: 1.5, bgcolor: 'action.hover', borderRadius: 1, width: '100%' }}>
                <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                    Error: {message}
                </Typography>
             </Box>
        )}

        <Button
          variant="contained"
          size="large"
          onClick={onRetry || (() => window.location.reload())}
          sx={{ mt: 1, minWidth: 200 }}
        >
          {config.action || 'Retry'}
        </Button>
      </Paper>
    </Box>
  );
};
