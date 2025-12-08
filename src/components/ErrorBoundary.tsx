import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FallbackMode } from '../types';
import { ErrorScreen } from './ErrorScreen';
import { ErrorReporter } from '../services/ErrorReporter';

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
    // Log WebGL context errors but don't break the app
    if (error.message.includes('WebGL') || error.message.includes('context')) {
      console.warn('WebGL context error caught by boundary:', error);
      // Allow recovery mechanisms to handle this
      return;
    }

    console.error("Uncaught error:", error, errorInfo);

    // Capture to Sentry
    ErrorReporter.captureException(error, {
        componentStack: errorInfo.componentStack
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <ErrorScreen
            mode={FallbackMode.GENERIC_ERROR}
            message={this.state.error?.message}
            onRetry={() => window.location.reload()}
        />
      );
    }

    return this.props.children;
  }
}
