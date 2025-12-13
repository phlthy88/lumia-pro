# Triangulated AI Workflow: Zero-Hallucination Protocol

## Core Principles

1. **No placeholders** — Every code block must be complete and runnable
2. **No assumptions** — Each task includes exact file paths, line numbers, and expected outputs
3. **Verification gates** — Each handoff requires passing specific tests before proceeding
4. **Triangulated review** — Every output is verified by a different model before integration

---

## Model Assignments

| Model | Role | Verification By |
|-------|------|-----------------|
| **KIMI K2** | Implementation (pure functions, hooks) | Claude |
| **GEMINI 2.5 Pro** | Services & rewrites (full files) | Claude |
| **CLAUDE** | Architecture, integration, final review | Gemini |

---

## SPRINT 1: Core Hooks (Days 1-3)

### TASK 1.1: KIMI K2 — Implement `useResourceManager`

**Input Files to Read:**
```
/home/jlf88/lumia-pro/src/types.ts (lines 1-50 for type patterns)
/home/jlf88/lumia-pro/lumia-pro-improved.ts (lines 280-330 for reference)
```

**Output File:**
```
/home/jlf88/lumia-pro/src/hooks/useResourceManager.ts
```

**Exact Requirements:**
```typescript
// Must export these exact types and functions:
export type ResourceType = 'stream-track' | 'blob-url' | 'timer' | 'audio-node';

export interface ManagedResource {
  type: ResourceType;
  id: string;
  cleanup: () => void;
}

export interface UseResourceManagerReturn {
  register: (type: ResourceType, resource: unknown, cleanup: () => void) => string;
  unregister: (id: string) => void;
  cleanup: () => void;
  getResourceCount: () => number;
}

export const useResourceManager: () => UseResourceManagerReturn;
```

**Constraints:**
- Maximum 60 lines of code (excluding types)
- Must use `useRef` for resource storage (not useState)
- Must call all cleanup functions on unmount via `useEffect`
- Must handle cleanup errors with try/catch (log to console.warn)
- Must generate IDs with `crypto.randomUUID()`

**Verification Command (run by Claude):**
```bash
cd /home/jlf88/lumia-pro
npm run typecheck
# Expected: No errors

# Then verify exports:
grep -c "export const useResourceManager" src/hooks/useResourceManager.ts
# Expected output: 1

grep -c "export type ResourceType" src/hooks/useResourceManager.ts
# Expected output: 1

wc -l src/hooks/useResourceManager.ts
# Expected output: < 80
```

**Handoff Artifact:**
```
KIMI_1.1_COMPLETE.md containing:
- Full file content of useResourceManager.ts
- Output of verification commands
- Any deviations from spec with justification
```

---

### TASK 1.2: KIMI K2 — Implement `useCapture`

**Depends On:** Nothing (can run parallel with 1.1)

**Input Files to Read:**
```
/home/jlf88/lumia-pro/src/types.ts
/home/jlf88/lumia-pro/lumia-pro-improved.ts (lines 105-165)
```

**Output File:**
```
/home/jlf88/lumia-pro/src/hooks/useCapture.ts
```

**Exact Interface:**
```typescript
export interface UseCaptureOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onCapture: (blob: Blob) => void;
  shutter?: () => void;
}

export interface UseCaptureReturn {
  countdown: number;
  isBursting: boolean;
  takeScreenshot: () => void;
  startCountdown: (seconds: number) => void;
  startBurst: (count: number, delayMs?: number) => Promise<void>;
}

export const useCapture: (options: UseCaptureOptions) => UseCaptureReturn;
```

**Constraints:**
- Maximum 90 lines
- `takeScreenshot` must use `canvas.toBlob()` with JPEG format, quality 0.95
- `startCountdown` must decrement every 1000ms using `setTimeout`
- `startBurst` must be async, default delayMs = 100
- Must cleanup timers on unmount
- Must check `canvasRef.current` is not null before operations

**Verification Command:**
```bash
grep -c "toBlob" src/hooks/useCapture.ts
# Expected: 1

grep -c "setTimeout" src/hooks/useCapture.ts
# Expected: >= 2

grep -c "useEffect" src/hooks/useCapture.ts
# Expected: >= 1 (for cleanup)
```

---

### TASK 1.3: KIMI K2 — Implement `useVideoRecorder`

**Input Files to Read:**
```
/home/jlf88/lumia-pro/src/hooks/useRecorder.ts (lines 1-100 for existing patterns)
/home/jlf88/lumia-pro/lumia-pro-improved.ts (lines 170-275)
```

**Output File:**
```
/home/jlf88/lumia-pro/src/hooks/useVideoRecorder.ts
```

**Exact Interface:**
```typescript
export interface UseVideoRecorderOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  audioStream?: MediaStream | null;
  config?: {
    mimeType?: string;
    videoBitrate?: number;
    audioBitrate?: number;
  };
  onError?: (error: Error) => void;
}

export interface UseVideoRecorderReturn {
  isRecording: boolean;
  duration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
}

export const useVideoRecorder: (options: UseVideoRecorderOptions) => UseVideoRecorderReturn;
```

**Constraints:**
- Maximum 120 lines
- Codec fallback order: `video/webm;codecs=vp9` → `video/webm;codecs=vp8` → `video/webm`
- Must use `MediaRecorder.isTypeSupported()` for codec detection
- Default videoBitrate: 2500000, audioBitrate: 128000
- `stopRecording` must return Promise that resolves with Blob after `recorder.onstop`
- Duration must update every 100ms while recording
- Must NOT store blob anywhere — just return it

**Verification Command:**
```bash
grep -c "isTypeSupported" src/hooks/useVideoRecorder.ts
# Expected: >= 2

grep -c "MediaRecorder" src/hooks/useVideoRecorder.ts
# Expected: >= 3

grep "Promise<Blob" src/hooks/useVideoRecorder.ts
# Expected: shows return type
```

---

### TASK 1.4: KIMI K2 — Implement `cameraErrors.ts`

**Output File:**
```
/home/jlf88/lumia-pro/src/utils/cameraErrors.ts
```

**Exact Exports:**
```typescript
export enum CameraErrorCode {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  CAMERA_NOT_FOUND = 'CAMERA_NOT_FOUND',
  NOT_READABLE = 'NOT_READABLE',
  OVERCONSTRAINED = 'OVERCONSTRAINED',
  NOT_SECURE = 'NOT_SECURE',
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  UNKNOWN = 'UNKNOWN',
}

export const getCameraErrorCode: (error: unknown) => CameraErrorCode;
export const getCameraErrorMessage: (code: CameraErrorCode) => string;
```

**Error Mapping (exact):**
```typescript
// getCameraErrorCode must check these DOMException names:
'NotAllowedError' | 'PermissionDeniedError' → PERMISSION_DENIED
'NotFoundError' | 'DevicesNotFoundError' → CAMERA_NOT_FOUND
'NotReadableError' → NOT_READABLE
'OverconstrainedError' → OVERCONSTRAINED
'SecurityError' → NOT_SECURE
default → UNKNOWN
```

**Messages (exact):**
```typescript
PERMISSION_DENIED: 'Camera access denied. Please enable camera in browser settings.'
CAMERA_NOT_FOUND: 'No camera found. Please connect a camera and try again.'
NOT_READABLE: 'Camera is in use by another application.'
OVERCONSTRAINED: 'Camera cannot meet requested settings. Trying lower resolution.'
NOT_SECURE: 'Camera requires HTTPS. Please use a secure connection.'
NOT_SUPPORTED: 'Your browser does not support camera access.'
UNKNOWN: 'An unexpected camera error occurred.'
```

**Constraints:**
- Maximum 60 lines
- Must handle `error` being null/undefined (return UNKNOWN)
- Must check `(error as DOMException)?.name`

---

## CLAUDE VERIFICATION GATE 1

**After KIMI completes 1.1-1.4, Claude must:**

1. Read all four files
2. Run verification commands
3. Run typecheck: `npm run typecheck`
4. Create test file to verify interfaces work:

```typescript
// src/hooks/__tests__/new-hooks-smoke.test.ts
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
```

5. Run: `npm run test -- --run src/hooks/__tests__/new-hooks-smoke.test.ts`
6. All tests must pass before proceeding

**Handoff to GEMINI:**
```
CLAUDE_GATE1_PASSED.md containing:
- Typecheck output (must show no errors)
- Test output (must show 4 passing)
- List of files ready for integration
```

---

## SPRINT 2: Services & Integration (Days 4-6)

### TASK 2.1: GEMINI 2.5 Pro — Implement `MediaStorageService`

**Depends On:** CLAUDE_GATE1_PASSED

**Input Files to Read:**
```
/home/jlf88/lumia-pro/src/services/MediaStorageService.ts (existing file)
/home/jlf88/lumia-pro/src/types.ts
```

**Output File:**
```
/home/jlf88/lumia-pro/src/services/MediaStorageService.ts (full rewrite)
```

**Exact Interface:**
```typescript
export interface MediaItemMetadata {
  id: string;
  type: 'photo' | 'video';
  timestamp: number;
  size: number;
  duration?: number;
  mimeType: string;
}

export interface IMediaStorage {
  listMetadata(): Promise<MediaItemMetadata[]>;
  getBlob(id: string): Promise<Blob | null>;
  saveBlob(id: string, blob: Blob, metadata: Omit<MediaItemMetadata, 'id'>): Promise<void>;
  deleteBlob(id: string): Promise<void>;
  getTotalSize(): Promise<number>;
  clear(): Promise<void>;
}

export class IndexedDBMediaStorage implements IMediaStorage {
  constructor(dbName?: string, maxItems?: number, maxTotalSize?: number);
  // ... implement all methods
}

export const mediaStorage: IMediaStorage; // singleton instance
```

**Constraints:**
- Database name: `'lumia-media-library'`
- Object store name: `'media'`
- Default maxItems: 100
- Default maxTotalSize: 500MB (500 * 1024 * 1024)
- Must handle IndexedDB errors gracefully
- `saveBlob` must enforce eviction if limits exceeded (delete oldest first)
- Must use `idb` library or raw IndexedDB (no other dependencies)

**Verification (by Claude):**
```bash
grep -c "implements IMediaStorage" src/services/MediaStorageService.ts
# Expected: 1

grep -c "indexedDB" src/services/MediaStorageService.ts
# Expected: >= 1

grep "maxTotalSize" src/services/MediaStorageService.ts
# Expected: shows default value
```

---

### TASK 2.2: GEMINI 2.5 Pro — Rewrite `useCameraStream.ts`

**Input Files to Read:**
```
/home/jlf88/lumia-pro/src/hooks/useCameraStream.ts (current implementation)
/home/jlf88/lumia-pro/src/utils/cameraErrors.ts (from KIMI task 1.4)
/home/jlf88/lumia-pro/src/services/CameraControlService.ts
```

**Output File:**
```
/home/jlf88/lumia-pro/src/hooks/useCameraStream.ts (full rewrite)
```

**Required Changes:**
1. Import and use `getCameraErrorCode`, `getCameraErrorMessage` from `../utils/cameraErrors`
2. Add resolution fallback ladder:
```typescript
const RESOLUTION_LADDER = [
  { width: 3840, height: 2160 }, // 4K
  { width: 1920, height: 1080 }, // 1080p
  { width: 1280, height: 720 },  // 720p
  { width: 640, height: 480 },   // 480p
];
```
3. On `OverconstrainedError`, retry with next resolution in ladder
4. Add `errorMessage: string | null` to return value
5. Handle all error codes from `CameraErrorCode` enum

**Exact Return Type Addition:**
```typescript
// Add to existing return type:
errorMessage: string | null;
errorCode: CameraErrorCode | null;
```

**Verification:**
```bash
grep -c "getCameraErrorCode" src/hooks/useCameraStream.ts
# Expected: >= 1

grep -c "RESOLUTION_LADDER" src/hooks/useCameraStream.ts
# Expected: 1

grep -c "OverconstrainedError\|OVERCONSTRAINED" src/hooks/useCameraStream.ts
# Expected: >= 1
```

---

### TASK 2.3: CLAUDE — Integrate New Hooks into RecordingController

**Depends On:** Tasks 1.1-1.4, 2.1, 2.2 all verified

**Input Files:**
```
/home/jlf88/lumia-pro/src/controllers/RecordingController.tsx
/home/jlf88/lumia-pro/src/hooks/useResourceManager.ts
/home/jlf88/lumia-pro/src/hooks/useCapture.ts
/home/jlf88/lumia-pro/src/hooks/useVideoRecorder.ts
/home/jlf88/lumia-pro/src/services/MediaStorageService.ts
```

**Output File:**
```
/home/jlf88/lumia-pro/src/controllers/RecordingController.tsx (modified)
```

**Required Changes:**
1. Import new hooks at top of file
2. Replace inline recording logic with `useVideoRecorder`
3. Replace inline capture logic with `useCapture`
4. Add `useResourceManager` and register all streams/URLs
5. Use `mediaStorage` from MediaStorageService for persistence
6. Maintain exact same context API (no breaking changes to consumers)

**Context API Must Remain:**
```typescript
// These must still work after refactor:
const { isRecording, startRecording, stopRecording } = useRecordingContext();
const { takePhoto, photoBurstMode } = useRecordingContext();
const { mediaItems, deleteMediaItem } = useRecordingContext();
```

**Verification:**
```bash
npm run typecheck
# Must pass

npm run test -- --run src/controllers/__tests__/RecordingController.test.tsx
# Must pass

# Check imports:
grep "useResourceManager\|useCapture\|useVideoRecorder" src/controllers/RecordingController.tsx
# Expected: shows all three imports
```

---

## GEMINI VERIFICATION GATE 2

**After Claude completes 2.3, Gemini must:**

1. Review RecordingController changes
2. Verify no context API breaking changes by checking:
```bash
grep -A5 "RecordingContextState" src/controllers/RecordingController.tsx
# Verify interface unchanged
```

3. Run full test suite:
```bash
npm run test -- --run
```

4. Run the app and manually test:
- Start recording → verify video saves
- Take photo → verify photo saves
- Check media library shows items

**Handoff:**
```
GEMINI_GATE2_PASSED.md containing:
- Full test output
- Screenshot of working recording
- Any issues found
```

---

## SPRINT 3: Testing & Polish (Days 7-10)

### TASK 3.1: KIMI K2 — Write Unit Tests for New Hooks

**Output Files:**
```
/home/jlf88/lumia-pro/src/hooks/__tests__/useResourceManager.test.ts
/home/jlf88/lumia-pro/src/hooks/__tests__/useCapture.test.ts
/home/jlf88/lumia-pro/src/hooks/__tests__/useVideoRecorder.test.ts
```

**Test Requirements per Hook:**

**useResourceManager.test.ts (minimum 8 tests):**
```typescript
describe('useResourceManager', () => {
  it('registers a resource and returns an id');
  it('unregisters a resource and calls cleanup');
  it('cleanup() calls all registered cleanup functions');
  it('handles cleanup errors without throwing');
  it('getResourceCount returns correct count');
  it('auto-cleans on unmount');
  it('handles multiple resources of same type');
  it('generates unique ids for each resource');
});
```

**useCapture.test.ts (minimum 6 tests):**
```typescript
describe('useCapture', () => {
  it('takeScreenshot calls canvas.toBlob');
  it('takeScreenshot calls onCapture with blob');
  it('startCountdown decrements countdown state');
  it('startCountdown calls takeScreenshot at zero');
  it('startBurst takes multiple photos');
  it('cleans up timers on unmount');
});
```

**useVideoRecorder.test.ts (minimum 7 tests):**
```typescript
describe('useVideoRecorder', () => {
  it('startRecording sets isRecording to true');
  it('stopRecording returns a Blob');
  it('stopRecording sets isRecording to false');
  it('duration updates while recording');
  it('uses fallback codec if vp9 not supported');
  it('calls onError when MediaRecorder fails');
  it('handles missing canvas gracefully');
});
```

**Verification:**
```bash
npm run test -- --run src/hooks/__tests__/useResourceManager.test.ts
npm run test -- --run src/hooks/__tests__/useCapture.test.ts
npm run test -- --run src/hooks/__tests__/useVideoRecorder.test.ts
# All must pass

npm run test:coverage -- --run
# Coverage for new hooks must be > 80%
```

---

### TASK 3.2: GEMINI 2.5 Pro — Write E2E Tests

**Output File:**
```
/home/jlf88/lumia-pro/e2e/recording-flow.spec.ts
```

**Required Tests:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Recording Flow', () => {
  test('can start and stop video recording', async ({ page }) => {
    // Navigate to app
    // Click record button
    // Wait 2 seconds
    // Click stop
    // Verify media library has new item
  });

  test('can take a photo', async ({ page }) => {
    // Navigate to app
    // Click photo button
    // Verify media library has new photo
  });

  test('can delete media item', async ({ page }) => {
    // Take a photo first
    // Open media library
    // Delete the photo
    // Verify it's gone
  });

  test('handles camera permission denied', async ({ page, context }) => {
    // Deny camera permission
    // Navigate to app
    // Verify error message shown
  });
});
```

**Verification:**
```bash
npm run e2e:run -- recording-flow.spec.ts
# All tests must pass
```

---

### TASK 3.3: CLAUDE — Final Integration Review

**Checklist:**
```
[ ] All new files have correct TypeScript types
[ ] No `any` types except where absolutely necessary
[ ] All hooks clean up resources on unmount
[ ] RecordingController context API unchanged
[ ] All tests pass (unit + E2E)
[ ] Bundle size not increased by more than 5KB
[ ] No console.log statements left in code
```

**Commands:**
```bash
npm run typecheck
npm run lint
npm run test -- --run
npm run build
npm run size-check
```

**Final Handoff:**
```
SPRINT_COMPLETE.md containing:
- All verification outputs
- Bundle size before/after
- Test coverage report
- List of all new/modified files
```

---

## File Checklist

### New Files Created:
```
src/hooks/useResourceManager.ts (KIMI)
src/hooks/useCapture.ts (KIMI)
src/hooks/useVideoRecorder.ts (KIMI)
src/utils/cameraErrors.ts (KIMI)
src/hooks/__tests__/useResourceManager.test.ts (KIMI)
src/hooks/__tests__/useCapture.test.ts (KIMI)
src/hooks/__tests__/useVideoRecorder.test.ts (KIMI)
e2e/recording-flow.spec.ts (GEMINI)
```

### Modified Files:
```
src/services/MediaStorageService.ts (GEMINI - full rewrite)
src/hooks/useCameraStream.ts (GEMINI - full rewrite)
src/controllers/RecordingController.tsx (CLAUDE - integration)
src/hooks/index.ts (CLAUDE - add exports)
```

---

## Anti-Hallucination Rules

1. **No `// TODO` comments** — Code must be complete
2. **No `...` in code blocks** — Show full implementation
3. **No "similar to" references** — Exact code required
4. **No assumed imports** — List every import explicitly
5. **No placeholder function bodies** — Every function must have real logic
6. **Verification commands must be runnable** — Copy-paste ready
7. **Line counts are hard limits** — Exceed = reject

---

## Escalation Protocol

If any task cannot be completed as specified:

1. **STOP** — Do not proceed with partial implementation
2. **DOCUMENT** — Write exactly what is blocking
3. **HANDOFF** — Pass to Claude for architecture decision
4. **WAIT** — Do not continue until blocker resolved

---

*Protocol Version: 1.0*
*Created: December 13, 2024*
