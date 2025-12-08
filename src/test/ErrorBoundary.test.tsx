import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ErrorScreen } from '../components/ErrorScreen';
import { FallbackMode } from '../types';

describe('ErrorScreen Component', () => {
    it('renders correct title for GL_UNSUPPORTED', () => {
        render(<ErrorScreen mode={FallbackMode.GL_UNSUPPORTED} />);
        expect(screen.getByText('Graphics Not Supported')).toBeInTheDocument();
    });

    it('renders correct title for CAMERA_DENIED', () => {
        render(<ErrorScreen mode={FallbackMode.CAMERA_DENIED} />);
        expect(screen.getByText('Camera Access Denied')).toBeInTheDocument();
    });

    it('renders correct title for GENERIC_ERROR', () => {
        render(<ErrorScreen mode={FallbackMode.GENERIC_ERROR} />);
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('displays optional error message', () => {
        render(<ErrorScreen mode={FallbackMode.GENERIC_ERROR} message="Test error message" />);
        expect(screen.getByText('Error: Test error message')).toBeInTheDocument();
    });
});
