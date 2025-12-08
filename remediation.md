# Remediation & Workflow

## Overview
This document captures the **critical bugs** discovered during a fine‑tuned audit of the Lumia‑Studio‑Pro codebase and outlines the recommended *CI/CD* workflow to guarantee a **deploy‑ready** release.  The intent is to give any future maintainer a single source of truth: what to watch for, how the build system operates, and the exact change‑set needed to move from a broken to a production‑grade codebase.

---

### 1. Critical Bugs & Fixes
| # | Category | Problem | Why It Matters | Fix | Impact |
|---|----------|---------|--------------|------|-------|
| 1 | **Un‑handled promise rejections** | `LutService.loadFromUrl` returns an identity LUT when network or parse errors occur, silently hiding the error from its caller. | Silent failures impede debugging and can mislead users into thinking a LUT is working. | Wrap the fetch in `try / catch`, re‑throw an error or return a `Result<LutData, Error>`. Expose an `onError` callback to the hook. | Users get clear feedback; bugs surface during staging. |
| 2 | **Missing null check for `canvasRef.current`** | `useGLRenderer` is invoked before the canvas mounts, causing `virtualCamera.initialize(undefined)`. | Runtime crash on first render in slow browsers or mobile. | Guard: `if (canvasRef.current && streamReady) virtualCamera.initialize(canvasRef.current);` |
| 3 | **Event listener leaks** | The `online/offline` listeners are added each render but only *once* removed, potentially duplicating handlers on navigation. | Memory leak & duplicated toasts. | Ensure cleanup in the `useEffect`: `return () => { window.removeEventListener('offline', handleOffline); ... }`. |
| 4 | **State mutation via props** | `useCameraStream` mutates state directly (e.g. `setCapabilities({ maxFrameRate, ... })`). | React may skip updates; the UI does not reflect hardware changes. | Use functional updates: `setCapabilities(prev => ({ ...prev, maxFrameRate }))`. |
| 5 | **Circular imports** | `LutService` imports its own types from a test file in a way that Node can resolve a `undefined` export at boot. | Runtime errors when calling static helpers. | Extract types into a dedicated `src/types.ts` and import only from there. |
| 6 | **Un‑typed promise results** | `useGLRenderer` resolves to `void` but the caller assumes valid data. | A rejection propagates silently, causing orphaned WebGL contexts. | Catch rejections: `await renderPromise().catch(e => console.error(e))`. |
| 7 | **Inconsistent naming** | Interfaces are camelCase (`LutData`) while classes use PascalCase (`LutService`). | Poor readability, hinders onboarding. | Adopt an `I*` prefix for interfaces (`ILutData`). |
| 8 | **Hard‑coded LUT paths** | Using relative paths like `'/luts/bw/...cube'`; CDN or reverse‑proxy setup can break them. | 404s are silent unless logged. | Configure a `BASE_URL` in `vite.config.ts` and prefix all LUT URLs. Alternatively bundle LUTs into the static build. |
| 9 | **Missing LUT parsing tests** | `LutService.parseCube` is not unit‑tested for edge cases (missing size keyword, malformed lines). | Bugs from future LUT additions. | Write Jest tests covering missing size, extra whitespace, comments, multi‑value lines. |
| 10 | **Console.warn usage** | `LutService.parseCube` uses `console.warn` for missing size; logs may be suppressed in production. | Silent failures in live environments. | Replace with a telemetry service or configurable logger. |

---

### 2. Proposed CI / Deploy Pipeline
| Stage | Script | Purpose | Notes |
|---|---|---|---|
| **Lint** | `npm run lint` | Capture style violations early. | Fails on any Eslint rule breach. |
| **TypeCheck** | `npm run typecheck` | Verify no TypeScript errors. | Runs `tsc --noEmit`. |
| **Unit Tests** | `npm run test:unit` | Validate hooks & services. | Includes new tests for LUT parsing and error handling. |
| **Component Tests** | `npm run test:components` | Test UI flows, error boundaries. | Uses Jest + React‑Testing‑Library. |
| **E2E** | `npm run test:e2e` | Simulate real user interactions. | Playwright or Cypress. |
| **Build** | `npm run build` | Produce production bundle with Vite. | Uses asset hashing, tree‑shaking. |
| **Static Analysis** | `npm run audit` + `npm run snyk` | Detect vulnerable deps. | Fails the job on critical findings. |
| **Size Check** | `npm run size-check` | Assert bundle < 10 MB. | Reject oversized assets. |
| **Deploy** | `github-action` with `netlify deploy --prod` | Push build to CDN. | Automatic rollback on failure. |

#### Sample GitHub Actions Workflow
```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache-dependency-path: package-lock.json }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:unit
      - run: npm run test:components
      - run: npm run test:e2e
      - run: npm run build
      - run: npm run size-check
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/
``` 

---

### 3. Immediate Remediation Checklist
1. **Refactor `LutService`** → return `Result<LutData, Error>`, add `onError`. 
2. **Guard canvas init** in `AppContent`. 
3. **Functional state updates** in `useCameraStream`. 
4. **Extract shared types** into `src/types.ts`. 
5. **Replace console.warn** in `LutService` with a telemetry helper. 
6. **Add tests** for LUT parsing edge cases. 
7. **Implement BASE_URL** for LUT assets. 
8. **Update naming** conventions to `I*` for interfaces. 
9. **Configure Vite** to bundle LUTs inside `dist/static/luts`. 
10. **Add E2E tests** for LUT loading fallbacks and offline mode. 

Follow the CI pipeline above; once all automated checks pass and the bundle is within size limits, the project is *deploy‑ready*.

---

## Closing
Implementing the fixes and adopting the CI workflow will eliminate silent crashes, improve maintainability, and ensure that every build reaches production with confidence.  Feel free to cherry‐pick these changes or contribute a PR that integrates them.  
