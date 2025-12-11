import React from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';
import { Videocam, Refresh } from '@mui/icons-material';
import { ErrorBoundary } from './ErrorBoundary';

interface Props {
  children: React.ReactNode;
  onRetry?: () => void;
}

const CameraFallback: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <Box sx={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center',
    minHeight: 300,
    p: 3,
    bgcolor: 'grey.900',
    borderRadius: 1
  }}>
    <Videocam sx={{ fontSize: 64, color: 'grey.600', mb: 2 }} />
    <Alert severity="warning" sx={{ mb: 2, maxWidth: 400 }}>
      <Typography variant="h6" gutterBottom>
        Camera Error
      </Typography>
      <Typography variant="body2">
        Unable to access camera. Please check permissions and try again.
      </Typography>
    </Alert>
    <Button
      variant="contained"
      startIcon={<Refresh />}
      onClick={onRetry}
    >
      Retry Camera Access
    </Button>
  </Box>
);

export const CameraErrorBoundary: React.FC<Props> = ({ children, onRetry }) => (
  <ErrorBoundary fallback={<CameraFallback onRetry={onRetry} />}>
    {children}
  </ErrorBoundary>
);
