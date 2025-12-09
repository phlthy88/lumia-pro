# Lumia Pro Refactor: Sprint 1a

## Context

You are refactoring a React/TypeScript webcam application with WebGL rendering. The codebase has:
- A monolithic `src/App.tsx` (~48KB) that needs decomposition
- Resource cleanup issues causing memory leaks
- Marketing claims in README that don't match actual capabilities

This is Sprint 1a of a 4-sprint refactor. Focus ONLY on cleanup, honesty, and validation.

## Goals

1. Add proper `dispose()` methods and cleanup patterns
2. Fix misleading README/marketing copy
3. Add settings migration infrastructure
4. Validate with smoke tests

## Tasks

### 1. Add dispose() methods

Add or complete `dispose()` methods for these files. Each must release all resources (textures, buffers, listeners, streams, RAF handles, workers):

**src/engine/GLRenderer.ts**
- Already has partial dispose(). Audit and ensure ALL resources are released:
  - All textures in `this.textures` Map
  - `lutTexture`, `beautyMaskTexture`, `beautyMask2Texture`
  - `positionBuffer`
  - `program`
  - Cancel any pending RAF via `this.frameId`
  - Remove `webglcontextlost` listener
  - Clear `recoveryTimeout`
  - Null out `videoSource`, `overlaySource`, `beautyMaskSource`, `beautyMask2Source`

**src/services/VirtualCameraService.ts**
- Add dispose(): stop all tracks, close popout window, cancel RAF, close BroadcastChannel, remove all event listeners

**src/services/AIAnalysisService.ts**
- Add dispose(): release any canvas references, clear any pending analysis state

**src/hooks/useCameraStream.ts**
- Ensure useEffect cleanup stops all tracks, sets `videoRef.current.srcObject = null`, removes `devicechange` listener

**src/hooks/useGyroscope.ts**
- Ensure cleanup removes `deviceorientation` listener

**src/hooks/useMidi.ts**
- Ensure cleanup removes MIDI event listeners, closes ports if opened

**src/hooks/useVisionWorker.ts**
- Ensure cleanup terminates worker

### 2. Add beforeunload guard

In `src/App.tsx`, add a `beforeunload` handler that calls dispose on critical services to prevent orphaned resources:

```typescript
useEffect(() => {
  const handleUnload = () => {
    // Call dispose on renderer, virtual cam, etc.
  };
  window.addEventListener('beforeunload', handleUnload);
  return () => window.removeEventListener('beforeunload', handleUnload);
}, []);
```

### 3. Add low-memory logger

Create `src/hooks/useMemoryMonitor.ts`:
- Poll `performance.memory.usedJSHeapSize` every 10s (if available)
- Log warning if > 500MB
- Expose `isLowMemory` boolean and manual `lowMemoryMode` toggle
- Do NOT auto-unload assets—just log and expose state

### 4. Fix README claims

Edit `README.md`:
- Change "Gemini-powered" to "Heuristic-based" or "Rule-based" for AI features (there are no actual Gemini API calls)
- Change "70+ Professional LUTs" to actual count (~30)
- Keep virtual camera claims but add note: "Browser support varies; works best in Chrome"

### 5. Add settings migration

Create `src/services/SettingsMigration.ts`:

```typescript
const CURRENT_VERSION = 1;

interface VersionedSettings {
  version: number;
  data: Record<string, unknown>;
}

export function migrateSettings(): void {
  const raw = localStorage.getItem('lumia_settings');
  if (!raw) return;
  
  try {
    const parsed = JSON.parse(raw);
    const version = parsed.version ?? 0;
    
    if (version < CURRENT_VERSION) {
      // Run migrations sequentially
      let data = parsed.data ?? parsed;
      
      // v0 -> v1: example migration
      if (version < 1) {
        // Add any schema changes here
        console.log('[Settings] Migrated v0 -> v1');
      }
      
      localStorage.setItem('lumia_settings', JSON.stringify({
        version: CURRENT_VERSION,
        data
      }));
    }
  } catch (e) {
    console.error('[Settings] Migration failed, using defaults', e);
    localStorage.removeItem('lumia_settings');
  }
}
```

Call `migrateSettings()` early in app initialization (before hooks read from localStorage).

### 6. Smoke test validation

After completing tasks 1-5, verify:
- [ ] Existing E2E tests pass (`npm run test` and `npx playwright test`)
- [ ] Manual flow works: start camera → apply LUT → record short clip → stop
- [ ] DevTools Memory tab: take heap snapshot before and after 5 start/stop cycles; confirm no significant growth
- [ ] No new console errors

## Files to modify

- `src/engine/GLRenderer.ts`
- `src/services/VirtualCameraService.ts`
- `src/services/AIAnalysisService.ts`
- `src/hooks/useCameraStream.ts`
- `src/hooks/useGyroscope.ts`
- `src/hooks/useMidi.ts`
- `src/hooks/useVisionWorker.ts`
- `src/App.tsx`
- `README.md`

## Files to create

- `src/hooks/useMemoryMonitor.ts`
- `src/services/SettingsMigration.ts`

## Constraints

- Do NOT restructure App.tsx yet (that's Sprint 1b)
- Do NOT add new dependencies
- Do NOT modify the render pipeline logic—only add cleanup
- Keep changes minimal and focused on resource management
- Run `npm run typecheck` before committing

## Success criteria

1. All dispose() methods implemented and called in useEffect cleanups
2. README accurately reflects capabilities
3. Settings migration infrastructure in place
4. No memory leak regression (validated via manual test)
5. All existing tests still pass
