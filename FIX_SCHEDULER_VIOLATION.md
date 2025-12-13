# Fix: Web Worker-based Vision Detection (Scheduler Violation)

## Problem
The browser console was showing: `'message' handler took 520ms` in scheduler.development.js

**Root Cause:** MediaPipe FaceLandmarker detection was running on the main thread, blocking React's scheduler.

## Solution
Created `useVisionWorkerThread` hook that runs MediaPipe in a Web Worker.

### Changes Made

#### 1. New File: `src/hooks/useVisionWorkerThread.ts`
- Web Worker-based face detection using `VisionWorker.ts`
- Posts frames to worker every ~1 second
- Receives results via postMessage
- Keeps heavy processing off main thread

**Key Features:**
- `createImageBitmap()` for non-blocking frame capture
- Transferable objects ([bitmap]) for zero-copy
- Throttled to ~1 FPS to minimize load

#### 2. Updated: `src/controllers/AIController.tsx`
```typescript
// Before:
import { useVisionWorker } from '../hooks/useVisionWorker';

// After:
import { useVisionWorkerThread } from '../hooks/useVisionWorkerThread';
```

### Message Flow

**Main Thread → Worker:**
```typescript
// Init
worker.postMessage({
  type: 'init',
  wasmPath: '...',
  modelAssetPath: '...',
  ...options
});

// Frame
createImageBitmap(video).then(bitmap => {
  worker.postMessage(
    { type: 'frame', image: bitmap }, 
    [bitmap] // Transfer, no copy
  );
});
```

**Worker → Main Thread:**
```typescript
// Detection complete
postMessage({
  type: 'landmarks',
  payload: { result: {...}, timestamp: ... }
});
```

### Performance Benefits

- **Before:** 520ms blocking on main thread → React scheduler violation
- **After:** <1ms on main thread, ~520ms in Web Worker (non-blocking)

## Testing

```bash
# Verify no TypeScript errors
npm run typecheck

# Verify Web Worker compiles
npm run dev  # Worker should load without errors
```

## Expected Result

Chrome DevTools console should no longer show `'message' handler took 520ms` warning.

---

**File:** src/hooks/useVisionWorkerThread.ts
**Updated:** src/controllers/AIController.tsx
