/**
 * @fileoverview Utilities for classifying and handling camera-related errors.
 */

export enum CameraErrorCode {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  CAMERA_NOT_FOUND = 'CAMERA_NOT_FOUND',
  NOT_READABLE = 'NOT_READABLE',
  OVERCONSTRAINED = 'OVERCONSTRAINED',
  NOT_SECURE = 'NOT_SECURE',
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  UNKNOWN = 'UNKNOWN',
}

export const getCameraErrorCode = (error: unknown): CameraErrorCode => {
  if (!error) return CameraErrorCode.UNKNOWN;
  
  const errorName = String((error as DOMException)?.name).trim();

  switch (errorName) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return CameraErrorCode.PERMISSION_DENIED;
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return CameraErrorCode.CAMERA_NOT_FOUND;
    case 'NotReadableError':
      return CameraErrorCode.NOT_READABLE;
    case 'OverconstrainedError':
      return CameraErrorCode.OVERCONSTRAINED;
    case 'SecurityError':
      return CameraErrorCode.NOT_SECURE;
    default:
      return CameraErrorCode.UNKNOWN;
  }
};

const ERROR_MESSAGES: Record<CameraErrorCode, string> = {
  [CameraErrorCode.PERMISSION_DENIED]: 'Camera access denied. Please enable camera in browser settings.',
  [CameraErrorCode.CAMERA_NOT_FOUND]: 'No camera found. Please connect a camera and try again.',
  [CameraErrorCode.NOT_READABLE]: 'Camera is in use by another application.',
  [CameraErrorCode.OVERCONSTRAINED]: 'Camera cannot meet requested settings. Trying lower resolution.',
  [CameraErrorCode.NOT_SECURE]: 'Camera requires HTTPS. Please use a secure connection.',
  [CameraErrorCode.NOT_SUPPORTED]: 'Your browser does not support camera access.',
  [CameraErrorCode.UNKNOWN]: 'An unexpected camera error occurred.',
};

export const getCameraErrorMessage = (code: CameraErrorCode): string => {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN;
};