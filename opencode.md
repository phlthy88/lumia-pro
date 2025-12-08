# Debugging PWA memory usage 1GB idle

**Session ID:** ses_4ffe1e9b8ffeas8cZRL9vK8laU
**Created:** 12/8/2025, 5:38:50 PM
**Updated:** 12/8/2025, 5:40:22 PM

---

## User

debug the massive memory usage of teh pwa, over 1gb idle

---

## Assistant

---

## User

debug the massive memory usage of teh pwa, over 1gb idle\

---

## Assistant

```
Tool: task
```

```
Tool: task
```

```
Tool: task
```

```
Tool: task
```

```
Tool: task
```

```
Tool: websearch
```

---

## Assistant

### Plan to Debug Massive Memory Usage in Lumia Pro PWA (>1GB Idle)

Based on codebase analysis and web research, the excessive idle memory likely stems from a combination of WebGL resource leaks, incomplete cleanup in services/hooks, unbounded caches, and potential accumulation in rendering loops. Here's a structured plan to identify and fix the root causes.

#### 1. **Initial Profiling and Measurement (1-2 hours)**
   - Use Chrome DevTools Memory tab to capture heap snapshots and allocation timelines during idle periods (after loading the app and letting it sit for 5-10 minutes).
   - Monitor for detached DOM nodes, large object graphs (e.g., MediaStreams, WebGL textures), and growing heap size.
   - Check Performance tab for forced GC events and memory pressure warnings.
   - Record baseline: Total heap size, detached elements, and any "leaked" objects.
   - Goal: Confirm leaks and identify top memory consumers (e.g., WebGL contexts, canvases, or cached data).

#### 2. **Code Review for Memory Leaks (2-4 hours)**
   - **WebGL/Resource Disposal Issues**:
     - In `GLRenderer.ts`: Add explicit removal of the `webglcontextlost` event listener in `dispose()` (store handler reference). Clear any pending `setTimeout` in context recovery.
     - Review texture updates in `updateVideoTexture` and `updateOverlay` for unnecessary reallocations; add size checks to avoid redundant `texImage2D` calls.
     - Ensure `dispose()` is called on app unload or component unmount.
   - **Service/Hook Cleanup Gaps**:
     - Add `dispose()` methods to `AIAnalysisService`, `CameraControlService`, and `VirtualCameraService` to clear canvases, stop streams, cancel animations, and clear listener sets/queues.
     - In `useCameraStream.ts`: Set `videoRef.current.srcObject = null` and `pause()` in cleanup to release video element references.
     - In `useGyroscope.ts`: Explicitly remove sensor event listeners on cleanup.
     - In `VirtualCameraService`: Clear `constraintQueue` and cancel pending timeouts in `dispose()`.
     - In `PlatformBoostsService`: Clear `saveTimeout` in `dispose()`.
   - **Worker and Async Issues**:
     - Ensure `VisionWorker` receives `'dispose'` messages on termination; add worker-side inactivity timeout (30s) for auto-disposal.
     - In `CameraControlService`: Limit `constraintQueue` to 10 items and reject pending promises on service destruction.
   - **Caching and Persistent Data**:
     - Bound localStorage usage in `usePersistedState` (e.g., max keys/size, periodic cleanup).
     - Monitor LUT cache (`lutCacheRef`) for `Float32Array` sizes; consider compression if LUTs are large.
     - Review CacheStorage limits in `vite.config.ts`; add manual cleanup for expired entries if needed.
   - **Rendering Loops**: Add frame counters to detect accumulation in `GLRenderer` loops; force periodic cleanup if memory exceeds thresholds.

#### 3. **Targeted Fixes and Optimizations (4-6 hours)**
   - Implement fixes from review: Add dispose methods, event listener removals, and cleanup in `useEffect` returns.
   - Optimize large assets: Lazy-load LUTs/models only when needed; avoid preloading all in `public/luts/`.
   - PWA Tweaks: Resolve service worker conflict (unregister in `index.html` vs. VitePWA); ensure caches expire properly.
   - If idle memory persists, add global memory monitoring (e.g., `performance.memory` API) and force GC/cleanup on high usage.

#### 4. **Testing and Verification (2-4 hours)**
   - Re-profile with DevTools after fixes; compare heap snapshots for reductions.
   - Stress-test: Load multiple LUTs/videos, switch devices, run for extended periods, then idle.
   - Use React DevTools Profiler to check for unnecessary re-renders causing state bloat.
   - Monitor in production-like conditions (e.g., low-end devices) to ensure adaptive quality reduces memory.

#### Potential Tradeoffs and Questions
- Fixes may slightly increase bundle size (e.g., dispose logic) but prioritize memory safety.
- If the app uses heavy AI processing, consider offloading to workers more aggressively.
- Clarification: Does the memory spike occur immediately on load, or only after specific actions (e.g., camera use, LUT loading)? Any recent changes that coincided with the issue?

This plan should reduce idle memory significantly. Estimated total time: 8-16 hours. Ready to proceed with implementation?

---

