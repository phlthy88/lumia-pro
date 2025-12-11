import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';
import { Refresh, BugReport } from '@mui/icons-material';
import { ErrorReporter } from '../services/ErrorReporter';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorId: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = ErrorReporter.captureException(error, {
      tags: { boundary: 'ErrorBoundary' },
      extra: { componentStack: errorInfo.componentStack }
    });
    
    this.setState({ errorId });
    this.props.onError?.(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorId: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box sx={{ p: 3, textAlign: 'center', maxWidth: 500, mx: 'auto', mt: 8 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </Typography>
            {this.state.errorId && (
              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                Error ID: {this.state.errorId}
              </Typography>
            )}
          </Alert>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={this.handleReset}
            >
              Try Again
            </Button>
            <Button
              variant="outlined"
              startIcon={<BugReport />}
              onClick={this.handleReload}
            >
              Reload Page
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}
