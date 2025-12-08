import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCameraStream } from '../useCameraStream';
import { FallbackMode } from '../../types';

describe('useCameraStream', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('successfully initializes stream', async () => {
        const { result } = renderHook(() => useCameraStream());

        // Mock video element behavior
        const mockVideo = document.createElement('video');
        Object.defineProperty(mockVideo, 'videoWidth', { value: 1920 });
        Object.defineProperty(mockVideo, 'videoHeight', { value: 1080 });
        Object.defineProperty(mockVideo, 'readyState', { value: 0, writable: true });
        mockVideo.play = vi.fn().mockResolvedValue(undefined);

        // Inject mock video into ref
        result.current.videoRef.current = mockVideo;

        // Trigger effect by changing device ID
        act(() => {
            result.current.setActiveDeviceId('test-cam');
        });

        // Simulate loadeddata event to resolve the promise in the hook
        setTimeout(() => {
            Object.defineProperty(mockVideo, 'readyState', { value: 4, writable: true });
            mockVideo.dispatchEvent(new Event('loadeddata'));
        }, 100);

        // Wait for stream to be ready
        await waitFor(() => expect(result.current.streamReady).toBe(true), { timeout: 2000 });

        expect(result.current.error).toBeNull();
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
