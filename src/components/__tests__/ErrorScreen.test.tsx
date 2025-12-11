import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorScreen } from '../ErrorScreen';
import { FallbackMode } from '../../types';

describe('ErrorScreen', () => {
  it('renders GL_UNSUPPORTED error', () => {
    render(<ErrorScreen mode={FallbackMode.GL_UNSUPPORTED} />);

    expect(screen.getByText('Graphics Not Supported')).toBeInTheDocument();
    expect(screen.getByText(/WebGL 2.0/)).toBeInTheDocument();
  });

  it('renders CAMERA_DENIED error', () => {
    render(<ErrorScreen mode={FallbackMode.CAMERA_DENIED} />);

    expect(screen.getByText('Camera Access Denied')).toBeInTheDocument();
    expect(screen.getByText(/camera permissions/)).toBeInTheDocument();
  });

  it('renders CAMERA_NOT_FOUND error', () => {
    render(<ErrorScreen mode={FallbackMode.CAMERA_NOT_FOUND} />);

    expect(screen.getByText('No Camera Found')).toBeInTheDocument();
  });

  it('renders MEDIAPIPE_FAILED error', () => {
    render(<ErrorScreen mode={FallbackMode.MEDIAPIPE_FAILED} />);

    expect(screen.getByText('AI Engine Error')).toBeInTheDocument();
  });

  it('renders RECORDING_FAILED error', () => {
    render(<ErrorScreen mode={FallbackMode.RECORDING_FAILED} />);

    expect(screen.getByText('Recording Error')).toBeInTheDocument();
  });

  it('renders NETWORK_OFFLINE error', () => {
    render(<ErrorScreen mode={FallbackMode.NETWORK_OFFLINE} />);

    expect(screen.getByText('You are Offline')).toBeInTheDocument();
  });

  it('renders GENERIC_ERROR error', () => {
    render(<ErrorScreen mode={FallbackMode.GENERIC_ERROR} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('displays custom error message when provided', () => {
    render(
      <ErrorScreen 
        mode={FallbackMode.GENERIC_ERROR} 
        message="Custom error details" 
      />
    );

    expect(screen.getByText(/Custom error details/)).toBeInTheDocument();
  });

  it('calls onRetry when button clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorScreen mode={FallbackMode.GENERIC_ERROR} onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onRetry).toHaveBeenCalled();
  });

  it('reloads page when no onRetry provided', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    render(<ErrorScreen mode={FallbackMode.GENERIC_ERROR} />);

    fireEvent.click(screen.getByRole('button'));

    expect(reloadMock).toHaveBeenCalled();
  });

  it('shows correct action button text for each mode', () => {
    const { rerender } = render(<ErrorScreen mode={FallbackMode.GL_UNSUPPORTED} />);
    expect(screen.getByRole('button', { name: /Learn More/i })).toBeInTheDocument();

    rerender(<ErrorScreen mode={FallbackMode.CAMERA_DENIED} />);
    expect(screen.getByRole('button', { name: /Open Settings/i })).toBeInTheDocument();

    rerender(<ErrorScreen mode={FallbackMode.MEDIAPIPE_FAILED} />);
    expect(screen.getByRole('button', { name: /Reload Engine/i })).toBeInTheDocument();
  });
});
