import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CameraErrorCode } from '../../utils/cameraErrors';

// Mock cameraService
vi.mock('../../services/CameraControlService', () => ({
    cameraService: {
        initialize: vi.fn(),
        getSettings: vi.fn(() => null),
        getCapabilities: vi.fn(() => null),
        setFormat: vi.fn(),
    },
}));

import { useCameraStream } from '../useCameraStream';
import { cameraService } from '../../services/CameraControlService';

// Helper to create error with name property (jsdom DOMException workaround)
const createNamedError = (name: string, message: string) => {
    const error = new Error(message);
    Object.defineProperty(error, 'name', { value: name, writable: false });
    return error;
};

describe('useCameraStream', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(navigator.mediaDevices, 'enumerateDevices').mockResolvedValue([]);
    });

    it('returns initial state correctly', () => {
        const { result } = renderHook(() => useCameraStream());

        expect(result.current.streamReady).toBe(false);
        expect(result.current.errorCode).toBeNull();
        expect(result.current.videoRef).toBeDefined();
    });

    it('handles permission denied error', async () => {
        const error = createNamedError('NotAllowedError', 'Permission denied');
        vi.mocked(cameraService.initialize).mockRejectedValue(error);

        const { result } = renderHook(() => useCameraStream());

        act(() => {
            (result.current.videoRef as any).current = document.createElement('video');
        });

        act(() => {
            result.current.setActiveDeviceId('test-device');
        });

        await waitFor(() => expect(result.current.errorCode).not.toBeNull(), { timeout: 5000 });

        expect(result.current.errorCode).toBe(CameraErrorCode.PERMISSION_DENIED);
        expect(result.current.streamReady).toBe(false);
    });

    it('handles camera not found error', async () => {
        const error = createNamedError('NotFoundError', 'No device found');
        vi.mocked(cameraService.initialize).mockRejectedValue(error);

        const { result } = renderHook(() => useCameraStream());

        act(() => {
            (result.current.videoRef as any).current = document.createElement('video');
        });

        act(() => {
            result.current.setActiveDeviceId('missing-device');
        });

        await waitFor(() => expect(result.current.errorCode).not.toBeNull(), { timeout: 5000 });

        expect(result.current.errorCode).toBe(CameraErrorCode.CAMERA_NOT_FOUND);
        expect(result.current.streamReady).toBe(false);
    });
});
