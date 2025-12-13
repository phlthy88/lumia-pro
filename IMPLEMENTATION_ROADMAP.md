# Lumia Pro Implementation Roadmap

## Executive Summary

Based on the peer review (6.5/10 overall), this roadmap outlines the path from **functional hobby project** to **production-ready software** (8+/10). The improvements focus on four pillars:

1. **Architecture** — Split monolithic hooks, add render pipeline abstraction
2. **Testing** — Increase coverage from 58% to 80%+
3. **Reliability** — Centralized resource management, browser-specific error handling
4. **Performance** — Full pipeline control via performance modes

---

## Current State Assessment

| Metric | Current | Target |
|--------|---------|--------|
| Test Coverage | 58% (350 tests) | 80%+ |
| Bundle Size | 282KB | <300KB |
| `useRecorder.ts` | 518 lines | <150 lines per hook |
| Error Paths Covered | ~40% | 90%+ |
| Resource Leak Risk | High | Eliminated |

### Critical Issues Identified

1. **Monolithic Hook Disease** — `useRecorder.ts` does 5 things in 518 lines
2. **Scattered Resource Cleanup** — No centralized ownership model
3. **Incomplete Error Handling** — Missing `OverconstrainedError`, `NotReadableError`, Safari quirks
4. **Performance Mode Disconnect** — Doesn't control bitrate, analysis sampling, or canvas scaling

---

## Phase 1: Foundation (Weeks 1-2)

### 1.1 Split `useRecorder` into Composable Hooks

**Goal:** Replace 518-line monolith with 4 focused hooks

| New Hook | Lines | Responsibility |
|----------|-------|----------------|
| `useMediaLibrary` | ~80 | IDB storage, eviction, lazy blob loading |
| `useCapture` | ~90 | Screenshot, burst mode, countdown |
| `useVideoRecorder` | ~120 | MediaRecorder lifecycle, codec negotiation |
| `useResourceManager` | ~60 | Centralized cleanup, audit trail |

**Implementation Steps:**

```bash
# Create new hook files
touch src/hooks/useMediaLibrary.ts
touch src/hooks/useCapture.ts
touch src/hooks/useVideoRecorder.ts
touch src/hooks/useResourceManager.ts
```

**Reference:** See `lumia-pro-improved.ts` for complete implementations.

**Migration Strategy:**
1. Create new hooks alongside existing `useRecorder.ts`
2. Update `RecordingController.tsx` to use new hooks
3. Run full test suite to verify behavior
4. Delete old `useRecorder.ts` once stable

### 1.2 Add `useResourceManager` Hook

**Goal:** Eliminate resource leaks with centralized ownership

```typescript
// Usage pattern
const { register, unregister, cleanup } = useResourceManager();

// Register a stream track
const trackId = register('stream-track', track, () => track.stop());

// Register a blob URL
const urlId = register('blob-url', url, () => URL.revokeObjectURL(url));

// Auto-cleanup on unmount (built-in)
```

**Integration Points:**
- `CameraController.tsx` — Register camera tracks
- `RecordingController.tsx` — Register audio tracks, blob URLs
- `AIController.tsx` — Register worker instances

### 1.3 Improve Error Handling

**Goal:** Browser-specific error detection with user-friendly messages

**New Error Codes:**
```typescript
export enum CameraErrorCode {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  CAMERA_NOT_FOUND = 'CAMERA_NOT_FOUND',
  NOT_READABLE = 'NOT_READABLE',      // Camera in use
  OVERCONSTRAINED = 'OVERCONSTRAINED', // Resolution too high
  NOT_SECURE = 'NOT_SECURE',          // HTTPS required
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  UNKNOWN = 'UNKNOWN',
}
```

**Update `useCameraStream.ts`:**
```typescript
// Before
catch (error) {
  if (error.name === 'NotAllowedError') {
    setFallback(FallbackMode.CAMERA_DENIED);
  }
}

// After
catch (error) {
  const code = getCameraErrorCode(error);
  if (code === CameraErrorCode.OVERCONSTRAINED) {
    // Retry at lower resolution
    return initializeWithFallback(deviceId, 720);
  }
  setFallback(mapCodeToFallback(code));
  setErrorMessage(getCameraErrorMessage(code));
}
```

---

## Phase 2: Pipeline & Testing (Weeks 3-5)

### 2.1 Extend Performance Mode to Control Full Pipeline

**Goal:** Make performance modes actually control the render pipeline

**Current State:**
```typescript
// performanceModes only sets targetFPS and features
// Recorder bitrate is hardcoded at 2.5 Mbps
// AI analysis runs on every frame
```

**Target State:**
```typescript
export interface PerformanceModeConfig {
  name: string;
  targetFPS: number;
  resolution: { width: number; height: number };
  features: {
    backgroundBlur: boolean;
    autoFraming: boolean;
    noiseCancellation: boolean;
  };
  // NEW
  recorderBitrate: number;      // kbps
  analysisSampling: number;     // 0-1 fraction
  canvasScalingFactor: number;  // 0.25 = 1/4 resolution
}

export const performanceModes = {
  quality: {
    targetFPS: 60,
    resolution: { width: 1920, height: 1080 },
    recorderBitrate: 4000,
    analysisSampling: 1.0,
    canvasScalingFactor: 1.0,
    features: { backgroundBlur: true, autoFraming: true, noiseCancellation: true },
  },
  balanced: {
    targetFPS: 30,
    resolution: { width: 1280, height: 720 },
    recorderBitrate: 2500,
    analysisSampling: 0.5,
    canvasScalingFactor: 0.5,
    features: { backgroundBlur: true, autoFraming: true, noiseCancellation: true },
  },
  performance: {
    targetFPS: 30,
    resolution: { width: 960, height: 540 },
    recorderBitrate: 1000,
    analysisSampling: 0.25,
    canvasScalingFactor: 0.25,
    features: { backgroundBlur: false, autoFraming: false, noiseCancellation: false },
  },
};
```

**Integration:**
1. `useVideoRecorder` reads `recorderBitrate` from context
2. `AIController` reads `analysisSampling` to skip frames
3. `GLRenderer` reads `canvasScalingFactor` for output resolution

### 2.2 Increase Test Coverage to 80%+

**Priority Test Targets:**

| Module | Current | Target | Focus Areas |
|--------|---------|--------|-------------|
| `useCameraStream` | 23.8% | 80% | Error paths, Safari quirks |
| `useRecorder` (split) | 26.7% | 90% | Each new hook individually |
| `GLRenderer` | 45% | 75% | Context loss, shader errors |
| `VirtualCameraService` | 60% | 85% | Browser compatibility |

**New Test Files:**
```bash
src/hooks/__tests__/useMediaLibrary.test.ts
src/hooks/__tests__/useCapture.test.ts
src/hooks/__tests__/useVideoRecorder.test.ts
src/hooks/__tests__/useResourceManager.test.ts
src/hooks/__tests__/useCameraStream.comprehensive.test.ts
```

**Testing Patterns:**
```typescript
// Mock storage for useMediaLibrary
const mockStorage: IMediaStorage = {
  listMetadata: vi.fn().mockResolvedValue([]),
  getBlob: vi.fn().mockResolvedValue(new Blob()),
  saveBlob: vi.fn().mockResolvedValue(undefined),
  deleteBlob: vi.fn().mockResolvedValue(undefined),
};

// Test error paths
it('handles OverconstrainedError by retrying at lower resolution', async () => {
  mockGetUserMedia.mockRejectedValueOnce(
    new DOMException('', 'OverconstrainedError')
  );
  mockGetUserMedia.mockResolvedValueOnce(mockStream);
  
  const { result } = renderHook(() => useCameraStream());
  await waitFor(() => expect(result.current.streamReady).toBe(true));
  expect(mockGetUserMedia).toHaveBeenCalledTimes(2);
});
```

### 2.3 Add E2E Tests for Safari

**Goal:** Catch Safari-specific issues before production

**New E2E Tests:**
```typescript
// e2e/safari-compatibility.spec.ts
test('handles Safari video.readyState polling', async ({ page }) => {
  // Safari doesn't fire loadedmetadata reliably
});

test('handles Safari canvas.captureStream() frame rate', async ({ page }) => {
  // Safari returns different frame rate than requested
});

test('handles Safari private browsing SecurityError', async ({ page }) => {
  // navigator.mediaDevices throws in private mode
});
```

**CI Integration:**
```yaml
# .github/workflows/e2e.yml
jobs:
  safari:
    runs-on: macos-latest
    steps:
      - uses: browser-actions/setup-safari@latest
      - run: npm run e2e:safari
```

---

## Phase 3: Polish & Features (Weeks 6-8)

### 3.1 Create Render Pipeline Abstraction

**Goal:** Decouple rendering stages for easier testing and extension

```typescript
// src/engine/RenderPipeline.ts
export interface RenderStage {
  name: string;
  enabled: boolean;
  process(input: ImageData, params: RenderParams): ImageData;
}

export class RenderPipeline {
  private stages: RenderStage[] = [];

  addStage(stage: RenderStage): void { ... }
  removeStage(name: string): void { ... }
  process(input: ImageData, params: RenderParams): ImageData {
    return this.stages
      .filter(s => s.enabled)
      .reduce((data, stage) => stage.process(data, params), input);
  }
}
```

**Benefits:**
- Each stage testable in isolation
- Easy to add/remove effects
- Performance profiling per stage

### 3.2 Add Preset System

**Goal:** Deterministic, shareable color grading presets

```typescript
// src/services/PresetService.ts
export interface Preset {
  id: string;
  name: string;
  version: number;
  color: Partial<ColorGradeParams>;
  transform?: Partial<TransformParams>;
  metadata: {
    author?: string;
    description?: string;
    tags?: string[];
  };
}

export class PresetService {
  async save(preset: Preset): Promise<void>;
  async load(id: string): Promise<Preset>;
  async export(id: string): Promise<string>; // JSON
  async import(json: string): Promise<Preset>;
  async share(id: string): Promise<string>; // URL
}
```

### 3.3 Add Composition Guides

**Goal:** Professional framing assistance

**New Overlay Options:**
- Rule of thirds grid (existing)
- Golden ratio spiral
- Center crosshair
- Safe areas (90%/80%)
- Live histogram overlay
- Focus peaking (existing)
- Zebra stripes (existing)

**Implementation:**
```typescript
// src/hooks/useOverlays.ts
export interface OverlayConfig {
  grid: GridType;
  aspectRatio: AspectRatio;
  safeArea: boolean;
  timecode: boolean;
  // NEW
  histogram: boolean;
  goldenSpiral: boolean;
  centerCrosshair: boolean;
}
```

---

## Phase 4: Production Hardening (Weeks 9-12)

### 4.1 Add Error Boundary + Telemetry

**Goal:** Catch and report errors in production

```typescript
// src/components/ErrorBoundary.tsx (enhanced)
export class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Report to Sentry
    Sentry.captureException(error, {
      extra: { componentStack: info.componentStack },
    });
    
    // Show recovery UI
    this.setState({ hasError: true, error });
  }
}
```

**Telemetry Events:**
- `camera.init.success` / `camera.init.error`
- `recording.start` / `recording.stop` / `recording.error`
- `ai.analysis.complete` / `ai.analysis.error`
- `performance.mode.change`

### 4.2 Add Memory Monitoring

**Goal:** Prevent OOM crashes on mobile

```typescript
// src/hooks/useMemoryMonitor.ts (enhanced)
export const useMemoryMonitor = (options: {
  warningThreshold: number; // MB
  criticalThreshold: number;
  onWarning: () => void;
  onCritical: () => void;
}) => {
  useEffect(() => {
    const interval = setInterval(() => {
      const memory = (performance as any).memory;
      if (!memory) return;
      
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      if (usedMB > options.criticalThreshold) {
        options.onCritical();
      } else if (usedMB > options.warningThreshold) {
        options.onWarning();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [options]);
};
```

### 4.3 Add Offline Support

**Goal:** Full PWA functionality

**Service Worker Enhancements:**
```javascript
// public/sw.js
const CACHE_VERSION = 'v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/luts/*.cube',
  '/models/*.tflite',
  '/wasm/*.wasm',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});
```

---

## Implementation Checklist

### Phase 1 (Weeks 1-2)
- [ ] Create `useMediaLibrary.ts` with tests
- [ ] Create `useCapture.ts` with tests
- [ ] Create `useVideoRecorder.ts` with tests
- [ ] Create `useResourceManager.ts` with tests
- [ ] Update `RecordingController.tsx` to use new hooks
- [ ] Add browser-specific error handling to `useCameraStream.ts`
- [ ] Delete old `useRecorder.ts`

### Phase 2 (Weeks 3-5)
- [ ] Extend `PerformanceModeConfig` with pipeline controls
- [ ] Update `useVideoRecorder` to read bitrate from context
- [ ] Update `AIController` to respect `analysisSampling`
- [ ] Update `GLRenderer` to respect `canvasScalingFactor`
- [ ] Add comprehensive tests for `useCameraStream`
- [ ] Add Safari E2E tests
- [ ] Achieve 80% test coverage

### Phase 3 (Weeks 6-8)
- [ ] Create `RenderPipeline` abstraction
- [ ] Add `PresetService` with import/export
- [ ] Add composition guide overlays
- [ ] Add preset sharing via URL

### Phase 4 (Weeks 9-12)
- [ ] Enhance `ErrorBoundary` with Sentry integration
- [ ] Add telemetry events
- [ ] Enhance memory monitoring with thresholds
- [ ] Improve service worker caching
- [ ] Add offline indicator UI

---

## Success Metrics

| Metric | Current | Phase 1 | Phase 2 | Phase 4 |
|--------|---------|---------|---------|---------|
| Test Coverage | 58% | 65% | 80% | 85% |
| Largest Hook | 518 lines | 150 lines | 150 lines | 150 lines |
| Error Paths | ~40% | 70% | 90% | 95% |
| Safari Support | Partial | Partial | Full | Full |
| Memory Leaks | Possible | Unlikely | None | None |
| Offline Support | Basic | Basic | Full | Full |

---

## Quick Wins (Do Today)

1. **Add `useResourceManager`** — 60 lines, immediate leak prevention
2. **Add `getCameraErrorCode()`** — 30 lines, better error messages
3. **Update performance mode** — Add `recorderBitrate` field
4. **Add Safari detection** — Warn users about known issues

---

## References

- `lumia-pro-improved.ts` — Complete refactored implementations
- `AGENTS.md` — Development conventions
- `docs/ARCHITECTURE.md` — System architecture
- `docs/TROUBLESHOOTING.md` — Known issues

---

*Last Updated: December 13, 2024*
*Estimated Total Effort: 12 weeks (1 developer)*
