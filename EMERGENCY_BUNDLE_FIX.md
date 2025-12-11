# EMERGENCY BUNDLE SIZE FIX

## CURRENT STATE: 🔴 CRITICAL FAILURE
- Total bundle: 45MB (vs 10MB limit)
- Main chunks over 350KB limit
- size-check script FAILING

## IMMEDIATE FIXES (TODAY)

### 1. Dynamic Import MediaPipe (Priority 0)
```typescript
// BEFORE: Static import (388KB in main bundle)
import { FaceLandmarker } from '@mediapipe/tasks-vision';

// AFTER: Dynamic import (loads only when needed)
const loadMediaPipe = async () => {
  const { FaceLandmarker } = await import('@mediapipe/tasks-vision');
  return FaceLandmarker;
};
```
**Savings**: -388KB from main bundle

### 2. Split MUI Vendor Chunk (Priority 1)
```typescript
// vite.config.ts - Manual chunking
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'mui-core': ['@mui/material', '@mui/icons-material'],
          'mediapipe': ['@mediapipe/tasks-vision'],
          'vendor': ['react', 'react-dom']
        }
      }
    }
  }
});
```

### 3. Remove Unused Dependencies
- Check if all MUI components are actually used
- Remove any unused imports

## TARGET AFTER FIXES
- Main bundle: <200KB
- Total: <10MB
- size-check: ✅ PASSING
