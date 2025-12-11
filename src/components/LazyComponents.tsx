import { lazy } from 'react';

// Lazy load heavy components for better bundle splitting
export const PlatformBoostsPanel = lazy(() => import('./PlatformBoostsPanel'));
export const MediaLibrary = lazy(() => import('./MediaLibrary'));
export const VirtualCameraSettings = lazy(() => import('./VirtualCameraSettings'));
export const ThemeSettings = lazy(() => import('./ThemeSettings'));

// AI-related components
export const AIController = lazy(() => import('../controllers/AIController'));
export const RecordingController = lazy(() => import('../controllers/RecordingController'));
