import { describe, it, expect } from 'vitest';
import { useResourceManager } from '../useResourceManager';
import { useCapture } from '../useCapture';
import { useVideoRecorder } from '../useVideoRecorder';
import { getCameraErrorCode, CameraErrorCode } from '../../utils/cameraErrors';

describe('New hooks smoke test', () => {
  it('useResourceManager exports correct interface', () => {
    expect(typeof useResourceManager).toBe('function');
  });

  it('useCapture exports correct interface', () => {
    expect(typeof useCapture).toBe('function');
  });

  it('useVideoRecorder exports correct interface', () => {
    expect(typeof useVideoRecorder).toBe('function');
  });

  it('getCameraErrorCode handles NotAllowedError', () => {
    const error = new DOMException('', 'NotAllowedError');
    expect(getCameraErrorCode(error)).toBe(CameraErrorCode.PERMISSION_DENIED);
  });
});
