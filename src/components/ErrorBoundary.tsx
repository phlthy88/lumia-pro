import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { Refresh, WarningAmber } from '@mui/icons-material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Special handling for WebGL context loss
    if (error.message.includes('WebGL') || error.message.includes('context')) {
      console.warn('WebGL context error detected, attempting recovery');
      // Don't show error UI for WebGL context issues - let recovery mechanism handle it
      return { hasError: false };
    }
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    
    // Log WebGL context errors but don't break the app
    if (error.message.includes('WebGL') || error.message.includes('context')) {
      console.warn('WebGL context error caught by boundary:', error);
      // Allow recovery mechanisms to handle this
      return;
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm" sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
            <Paper elevation={4} sx={{ p: 4, textAlign: 'center', borderRadius: 4, bgcolor: 'background.paper' }}>
                <WarningAmber color="error" sx={{ fontSize: 64, mb: 2 }} />
                <Typography variant="h5" gutterBottom fontWeight="bold">
                    Something went wrong
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    The studio engine encountered a critical error.
                </Typography>
                
                {this.state.error && (
                    <Box sx={{ my: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2, textAlign: 'left', overflow: 'auto', maxHeight: 200 }}>
                        <Typography variant="caption" fontFamily="monospace" color="error">
                            {this.state.error.toString()}
                        </Typography>
                    </Box>
                )}

                <Button 
                    variant="contained" 
                    startIcon={<Refresh />} 
                    onClick={() => window.location.reload()}
                    sx={{ mt: 2 }}
                >
                    Reload Application
                </Button>
            </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}
