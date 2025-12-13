# AI Task Delegation Plan

## Model Strengths Assessment

| Model | Strengths | Best For |
|-------|-----------|----------|
| **Claude (Kiro)** | Architecture, refactoring, complex integrations, testing patterns, documentation | System design, hook composition, test strategy |
| **Gemini 2.5 Pro** | Large context, codebase analysis, comprehensive rewrites, API design | Full file rewrites, service layer, E2E test suites |
| **Kimi K2** | Fast iteration, algorithm implementation, focused tasks, TypeScript | Pure functions, utilities, individual hook implementations |

---

## Phase 1: Foundation (Weeks 1-2)

### 🔵 CLAUDE (Kiro) — Architecture & Integration

**Task 1.1: Design `useResourceManager` hook**
```
Create src/hooks/useResourceManager.ts with:
- Type-safe resource registration (stream-track, blob-url, timer, audio-node)
- Auto-cleanup on unmount
- Audit trail for debugging
- Integration guide for CameraController, RecordingController, AIController

Reference: lumia-pro-improved.ts lines 280-330
```

**Task 1.2: Refactor `RecordingController.tsx`**
```
Update src/controllers/RecordingController.tsx to:
- Use new composable hooks (useMediaLibrary, useCapture, useVideoRecorder)
- Integrate useResourceManager for all resources
- Maintain backward compatibility with existing context API
- Add proper TypeScript types for all new interfaces
```

**Task 1.3: Write test strategy document**
```
Create TESTING_STRATEGY.md with:
- Mock patterns for each new hook
- Integration test approach for RecordingController
- Coverage targets per module
```

---

### 🟢 GEMINI 2.5 Pro — Full Rewrites & Services

**Task 1.4: Rewrite `useCameraStream.ts` with comprehensive error handling**
```
Rewrite src/hooks/useCameraStream.ts to include:
- All error codes: NotAllowedError, NotFoundError, NotReadableError, 
  OverconstrainedError, SecurityError
- Resolution fallback ladder (4K → 1080p → 720p → 480p → any)
- Safari-specific workarounds (readyState polling, private browsing)
- Android Chrome quirks (undefined frameRate handling)
- User-friendly error messages via getCameraErrorMessage()

Full file rewrite expected (~200 lines)
```

**Task 1.5: Create `IMediaStorage` interface and IndexedDB implementation**
```
Create src/services/MediaStorageService.ts with:
- IMediaStorage interface (listMetadata, getBlob, saveBlob, deleteBlob)
- IndexedDB implementation with proper error handling
- Eviction policy (maxItems, maxTotalSize)
- Migration support for schema changes

Full service implementation (~150 lines)
```

**Task 1.6: Write E2E test suite for camera initialization**
```
Create e2e/camera-errors.spec.ts with:
- Permission denied flow
- Camera not found flow
- Camera in use flow
- Resolution fallback flow
- Safari private browsing flow

Use Playwright, target Chrome + Firefox + Safari
```

---

### 🟡 KIMI K2 — Focused Hook Implementations

**Task 1.7: Implement `useMediaLibrary` hook**
```
Create src/hooks/useMediaLibrary.ts:
- Props: { maxItems, maxTotalSize, storage: IMediaStorage }
- State: items (MediaItem[]), error
- Methods: addItem, deleteItem, loadItemUrl (lazy blob loading)
- Pure logic, no side effects except storage calls

Reference: lumia-pro-improved.ts lines 40-100
Target: <80 lines
```

**Task 1.8: Implement `useCapture` hook**
```
Create src/hooks/useCapture.ts:
- Props: { canvasRef, onCapture, shutter? }
- State: countdown, isBursting
- Methods: takeScreenshot, startCountdown, startBurst
- Pure logic, timer cleanup on unmount

Reference: lumia-pro-improved.ts lines 105-165
Target: <90 lines
```

**Task 1.9: Implement `useVideoRecorder` hook**
```
Create src/hooks/useVideoRecorder.ts:
- Props: { canvasRef, audioStream?, config?, onError? }
- State: isRecording, duration
- Methods: startRecording, stopRecording (returns Promise<Blob>)
- Codec negotiation: VP9 → VP8 → H.264 → WebM
- No storage coupling, returns blob only

Reference: lumia-pro-improved.ts lines 170-275
Target: <120 lines
```

**Task 1.10: Implement error utility functions**
```
Create src/utils/cameraErrors.ts:
- getCameraErrorCode(error: any): CameraErrorCode
- getCameraErrorMessage(code: CameraErrorCode): string
- Browser detection helpers

Reference: lumia-pro-improved.ts lines 335-395
Target: <60 lines
```

---

## Phase 2: Pipeline & Testing (Weeks 3-5)

### 🔵 CLAUDE (Kiro)

**Task 2.1: Extend PerformanceModeProvider**
```
Update src/providers/PerformanceModeProvider.tsx:
- Add recorderBitrate, analysisSampling, canvasScalingFactor to config
- Create usePerformanceConfig() hook for consumers
- Update all consumers (useVideoRecorder, AIController, GLRenderer)
```

**Task 2.2: Design render pipeline abstraction**
```
Create src/engine/RenderPipeline.ts:
- RenderStage interface
- Pipeline composition pattern
- Per-stage performance profiling
- Integration plan for GLRenderer
```

**Task 2.3: Write comprehensive tests for new hooks**
```
Create test files:
- src/hooks/__tests__/useMediaLibrary.test.ts
- src/hooks/__tests__/useCapture.test.ts
- src/hooks/__tests__/useVideoRecorder.test.ts
- src/hooks/__tests__/useResourceManager.test.ts

Target: 90% coverage per hook
```

---

### 🟢 GEMINI 2.5 Pro

**Task 2.4: Rewrite AIController with sampling control**
```
Update src/controllers/AIController.tsx:
- Read analysisSampling from performance context
- Skip frames based on sampling rate
- Add frame counter for deterministic sampling
- Maintain existing API compatibility
```

**Task 2.5: Create PresetService**
```
Create src/services/PresetService.ts:
- Preset interface with versioning
- IDB storage for presets
- Import/export as JSON
- URL-based sharing (base64 encoded)
```

**Task 2.6: Write Safari E2E tests**
```
Create e2e/safari-compatibility.spec.ts:
- video.readyState polling
- canvas.captureStream() frame rate
- Private browsing SecurityError
- MediaRecorder codec support
```

---

### 🟡 KIMI K2

**Task 2.7: Implement rate-limited analyzer wrapper**
```
Create src/services/RateLimitedAnalyzer.ts:
- withRateLimiting(analyzer, debounceMs, throttleMs)
- Pure higher-order function
- No internal state mutations

Reference: lumia-pro-improved.ts lines 440-480
Target: <50 lines
```

**Task 2.8: Implement composition guide overlays**
```
Update src/hooks/useOverlays.ts:
- Add goldenSpiral, centerCrosshair options
- Implement drawing functions for each
- Pure canvas drawing, no state

Target: +60 lines to existing file
```

**Task 2.9: Add memory monitoring thresholds**
```
Update src/hooks/useMemoryMonitor.ts:
- Add warningThreshold, criticalThreshold props
- Add onWarning, onCritical callbacks
- Implement threshold checking logic

Target: <40 lines added
```

---

## Phase 3-4: Polish & Production (Weeks 6-12)

### 🔵 CLAUDE (Kiro)
- Error boundary enhancement with Sentry
- Telemetry event design
- Final architecture review
- Documentation updates

### 🟢 GEMINI 2.5 Pro
- Service worker enhancements
- Full offline support
- Cloud export integrations
- Performance audit

### 🟡 KIMI K2
- Utility functions
- Pure algorithm implementations
- Small focused fixes
- Type definitions

---

## Prompt Templates

### For Kimi K2 (Focused Tasks)
```
You are implementing a focused React hook for Lumia Pro.

Requirements:
- TypeScript strict mode
- < [X] lines
- Pure logic, no side effects except [specific exceptions]
- Must be testable with mocked dependencies

Reference implementation: [paste from lumia-pro-improved.ts]

Create the hook with full TypeScript types.
```

### For Gemini 2.5 Pro (Full Rewrites)
```
You are rewriting a module for Lumia Pro camera application.

Context files to review:
- src/types.ts (type definitions)
- src/services/CameraControlService.ts (camera API)
- [relevant existing file]

Requirements:
- Full file rewrite
- Handle all error cases
- Browser compatibility (Chrome, Firefox, Safari)
- Maintain existing API where possible

Create the complete implementation.
```

### For Claude/Kiro (Architecture)
```
You are designing architecture for Lumia Pro.

Current state:
- [describe current implementation]

Problems:
- [list issues]

Design a solution that:
- Maintains backward compatibility
- Is testable
- Follows React best practices
- Integrates with existing controllers

Provide implementation + integration guide.
```

---

## Execution Order

```
Week 1:
  KIMI: 1.7, 1.8, 1.9, 1.10 (parallel - pure hooks)
  GEMINI: 1.5 (storage service)
  CLAUDE: 1.1 (resource manager design)

Week 2:
  KIMI: Unit tests for hooks
  GEMINI: 1.4, 1.6 (camera rewrite + E2E)
  CLAUDE: 1.2, 1.3 (integration + test strategy)

Week 3-4:
  KIMI: 2.7, 2.8, 2.9 (utilities)
  GEMINI: 2.4, 2.5, 2.6 (services + E2E)
  CLAUDE: 2.1, 2.2, 2.3 (architecture + tests)

Week 5+:
  All: Phase 3-4 tasks based on progress
```

---

## Handoff Protocol

1. **Before starting**: Pull latest, run `npm run typecheck && npm run test`
2. **After completing**: Run full test suite, update CHANGELOG.md
3. **PR naming**: `[MODEL] Task X.Y: Description`
4. **Review**: Claude reviews Kimi/Gemini PRs for architecture consistency

---

*Generated: December 13, 2024*
