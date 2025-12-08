# Lumia‑Studio‑Pro

## Overview
Lumia‑Studio‑Pro is a browser‑based video/photo editing tool that exposes a rich GLSL pipeline and a set of React‑based UI components. The codebase is a **TypeScript + React + Vite** project with a focus on real‑time color‑grading, virtual camera support and MIDI integration.

---

## Directory Layout
```
src/
  |-- App.tsx               # Root component
  |-- index.tsx             # Render entry point
  |-- hooks/                # Custom React hooks
  |   |-- useAIAnalysis.ts
  |   |-- useCameraStream.ts
  |   |-- useColorGrading.ts
  |   |-- useGLRenderer.ts
  |   |-- ...
  |-- services/             # Pure‑logic helpers
  |   |-- LutService.ts
  |   |-- AIAnalysisService.ts
  |   |-- CameraControlService.ts
  |   |-- PlatformBoostsService.ts
  |   |-- VirtualCameraService.ts
  |-- engine/               # GLSL + WebGL utilities
  |   |-- GLRenderer.ts
  |   |-- shaders/
  |-- components/           # UI components
  |   |-- controls/
  |   |-- layout/
  |   |-- ...
  |-- theme/
  |   |-- ThemeContext.tsx
  |   |-- m3-utils.ts
  |-- types.ts
  |-- vite.config.ts
public/                    # Static assets (icons, manifests, LUTs, models)
  |-- luts/
  |-- models/
README.md
package.json
tsconfig.json
``` 
---

## Essential Commands
```
npm install                 # Install all deps
npm run dev                 # Start Vite dev server (http://localhost:5173)
npm run build               # Production build → dist/
npm run preview             # Serve built assets
npm run clean                # Remove node_modules, lock, build artefacts
npm run lint                  # ESLint + TypeScript linting
npm run typecheck             # tsc --noEmit
npm run test:unit             # Jest unit tests
npm run test:components       # Jest component/UI tests
npm run test:e2e              # Playwright e2e tests
npm run size-check            # Assert bundle is <10 MB
``` 
---

## Code & Naming Conventions
| Element | Convention | Example |
|---------|------------|--------|
| Components | PascalCase | `AIWidget.tsx`, `ControlPanel.tsx` |
| Hooks | camelCase | `useColorGrading`, `useGyroscope` |
| Services | PascalCase | `LutService`, `VirtualCameraService` |
| Types / Interfaces | PascalCase prefixed with `I` | `ILutData`, `ICameraCapabilities` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_FPS`, `MAX_RESOLUTION` |
| Variables | camelCase | `cameraStream`, `lutList` |
| State Hooks | useX | `useActiveTab`, `useNetworkToast` |
---

## Testing Strategy
* **Unit** – Jest tests for pure logic (services, helpers). Each test file mirrors component structure.
* **Component** – `@testing-library/react` & `jest-dom`. Snapshot tests for UI stability.
* **E2E** – Playwright simulating full workflows (camera selection, LUT change, offline mode). CI runs against a real browser container.
* **Coverage** – Aim for >90 % on lines & branches. Tests are located in `src/__tests__`.
---

## Gotchas & Edge Cases
1. **Camera permission denied** – `useCameraStream` must handle `NotAllowedError` and surface a user‑friendly toast.
2. **Large LUT files** – Loading many `.cube` files can block the main thread; they are loaded asynchronously in `App.tsx` and the UI shows a loading indicator.
3. **Virtual camera API** – Only works on Chromium‑based browsers with the `MediaStreamTrackProcessor` API. Graceful fallback is required.
4. **MIDI sync lag** – `useMidi` attaches listeners in a `useEffect`. Ensure listeners are cleaned up on unmount.
5. **Offline mode** – The app should continue to render cached LUTs. `navigator.onLine` used to toggle `isOffline` state.
---

## External Rules & Conventions
* All `tsconfig` paths resolve `@/*` to `src/`.
* `vite.config.ts` includes `@vitejs/plugin-react` and `vite-plugin-pwa`.
* `package.json` scripts follow standard npm‑best‑practice: `dev`, `build`, `preview`, `clean`.
* No global state; context is used via React Context (`ThemeContext`).
* **Security** – No raw string concatenation for URLs; all assets are fetched from the same origin.
---

## Quick‑Start
```bash
npm ci
npm run dev
```
Open http://localhost:5173 and start playing with Camera, LUTs, and MIDI controls.
---

*For deeper technical explanations, refer to the inline comments in the source files.*