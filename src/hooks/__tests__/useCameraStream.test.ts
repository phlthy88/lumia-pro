import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCameraStream } from '../useCameraStream';
import { FallbackMode } from '../../types';

describe('useCameraStream', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('returns initial state correctly', () => {
        const { result } = renderHook(() => useCameraStream());

        expect(result.current.streamReady).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.videoRef).toBeDefined();
        expect(result.current.deviceList).toEqual([]);
    });

    it('handles permission denied error', async () => {
        // Mock NotAllowedError
        const mockGetUserMedia = vi.fn().mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'));
        Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: mockGetUserMedia, writable: true });

        const { result } = renderHook(() => useCameraStream());

        // Inject video ref
        result.current.videoRef.current = document.createElement('video');

        // Trigger effect
        act(() => {
            result.current.setActiveDeviceId('denied-cam');
        });

        await waitFor(() => expect(result.current.error).not.toBeNull());

        expect(result.current.error?.mode).toBe(FallbackMode.CAMERA_DENIED);
        expect(result.current.streamReady).toBe(false);
    });

    it('handles camera not found error', async () => {
        // Mock NotFoundError
        const mockGetUserMedia = vi.fn().mockRejectedValue(new DOMException('No device found', 'NotFoundError'));
        Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: mockGetUserMedia, writable: true });

        const { result } = renderHook(() => useCameraStream());

        // Inject video ref
        result.current.videoRef.current = document.createElement('video');

        // Trigger effect
        act(() => {
            result.current.setActiveDeviceId('missing-cam');
        });

        await waitFor(() => expect(result.current.error).not.toBeNull());

        expect(result.current.error?.mode).toBe(FallbackMode.CAMERA_NOT_FOUND);
        expect(result.current.streamReady).toBe(false);
    });
});
