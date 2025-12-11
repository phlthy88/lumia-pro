# AGENTS.md - Lumia Pro Development Guide

This document provides essential guidance for agents working in the Lumia Pro codebase. It captures project-specific patterns, conventions, and commands that aren't obvious from standard tooling.

## 📦 Project Overview

**Lumina Pro Lens** - Professional browser-based webcam studio with real-time color grading, AI scene analysis, and virtual camera output.

- **Type**: React 18 TypeScript SPA (Single Page Application)
- **Build Tool**: Vite 6
- **Testing**: Vitest with @testing-library/react
- **Styling**: Material UI 3 with Material Design 3
- **Graphics**: WebGL 2.0 with custom shaders
- **AI**: MediaPipe for vision tasks

## 🏗️ Architecture

### Core Technologies
- **Frontend Framework**: React 18 + TypeScript
- **Build System**: Vite
- **State Management**: React Context + Custom Hooks
- **UI Components**: Material UI 3 + Custom M3 theme
- **WebGL Engine**: Custom GLRenderer with shader pipeline
- **Testing**: Vitest + React Testing Library
- **E2E Testing**: Cypress + Playwright

### Directory Structure

```
src/
├── components/          # React UI components
│   ├── controls/       # Reusable form controls (MuiButton, MuiSelect, etc.)
│   ├── layout/         # Layout components (AppHeader, ControlDrawer)
│   └── index.ts        # Barrel exports
├── controllers/        # React Context providers with complex logic
│   ├── CameraController.tsx
│   ├── RenderController.tsx
│   ├── RecordingController.tsx
│   └── AIController.tsx
├── engine/             # WebGL rendering engine
│   ├── GLRenderer.ts   # Core WebGL renderer
│   └── shaders/        # GLSL shader files
├── hooks/              # Custom React hooks
│   ├── useRecorder.ts
│   ├── useCameraStream.ts
│   ├── useColorGrading.ts
│   └── useGLRenderer.ts
├── services/           # Business logic & API clients
│   ├── LutService.ts
│   ├── AIAnalysisService.ts
│   └── VirtualCameraService.ts
├── providers/          # React Context providers
│   ├── UIStateProvider.tsx
│   └── PerformanceModeProvider.tsx
├── test/               # Test utilities & setup
│   ├── setup.ts        # Vitest global mocks
│   └── TestBed.tsx     # Test wrapper component
├── theme/              # Material Design 3 theming
│   └── ThemeContext.tsx
└── types.ts            # Global TypeScript types
```

### Performance Modes

The app has three performance modes that affect rendering quality:
- **quality**: 60fps, full resolution (1920x1080+), all effects
- **balanced**: 30fps, 1280x720, most effects (default)
- **performance**: 30fps, 960x540, essential effects only

Controlled via `PerformanceModeProvider` and `usePerformanceModeContext()`.

## 💻 Essential Commands

### Development
```bash
npm run dev              # Start development server on http://localhost:3000
npm run build            # Production build
npm run build:staging    # Staging build
npm run build:prod       # Production build with production env
npm run preview          # Preview production build locally
```

### Code Quality
```bash
npm run typecheck        # TypeScript type checking
npm run lint             # ESLint check
npm run lint:fix         # ESLint fix
npm run clean            # Remove node_modules, package-lock, etc.
```

### Testing
```bash
npm run test             # Run vitest tests (watch mode)
npm run test:ui          # Run tests with Vitest UI
npm run test:coverage    # Run tests with coverage
npm run test:load        # Run k6 load tests
```

### Deployment & Analysis
```bash
npm run size-check       # Check bundle size
npm run size-check:phase2 # Check with additional validations
npm run analyze          # Build and run bundle analyzer
npm run lighthouse       # Generate Lighthouse report
```

### E2E Testing
```bash
npm run e2e              # Open Cypress test runner
npm run e2e:run          # Run Cypress tests headlessly
```

## 🧪 Testing Patterns

### Test Setup & Mocks

All tests use the global setup from `src/test/setup.ts` which provides:
- Mocked `navigator.mediaDevices`
- Mocked canvas contexts (2D and WebGL2)
- Mocked `MediaRecorder`
- Mocked `ResizeObserver`, `IntersectionObserver`
- Mocked `OffscreenCanvas`

**Critical**: When testing components that use WebGL or media devices, ensure these mocks are sufficient. If not, extend them in your test file.

### Hook Testing Pattern

```typescript
// Mock external dependencies FIRST
vi.mock('../engine/GLRenderer', () => ({
  GLRenderer: vi.fn().mockImplementation(() => ({ /* mock methods */ }))
}));

vi.mock('../hooks/useGLRenderer', () => ({
  useGLRenderer: vi.fn(() => ({ canvasRef: { current: null }, setLut: vi.fn() }))
}));

// Import after mocks
import { useRecorder } from '../hooks/useRecorder';
```

**Rule**: Always mock dependencies before importing the module under test.

### Component Testing Pattern

Use the provided `TestBed` wrapper for integration tests:

```typescript
import { TestBed } from '../test/TestBed';
import App from '../App';

render(<TestBed><App /></TestBed>);
```

The `TestBed` provides all necessary context providers:
- `ThemeProvider`
- `UIStateProvider`
- `PerformanceModeProvider`
- `CameraController`
- `RenderController`
- `AIController`
- `RecordingController`
- `ErrorBoundary`

### Controller Testing Pattern

Controllers are React Context providers. Test them by:
1. Rendering the controller with a test child component
2. Using the context hook in the child to verify behavior

```typescript
const TestChild = () => {
  const ctx = useRecordingContext();
  return <span data-testid="value">{ctx.isRecording ? 'yes' : 'no'}</span>;
};

render(<RecordingController><TestChild /></RecordingController>);
expect(screen.getByTestId('value')).toHaveTextContent('no');
```

## 🎨 Code Style & Conventions

### TypeScript
- **Strict mode enabled** - All code must be fully typed
- **No `any` type** - Use `unknown` or generics instead
- **No optional chaining abuse** - Prefer proper null checks
- **Use custom type guards** for complex type checks

### React Components
- **Functional components** with hooks (no class components)
- **File naming**: PascalCase for components, camelCase for hooks/utility
- **Props interfaces**: Define explicit interfaces, never inline types
- **Return types**: Always type component return as `JSX.Element`
- **No default exports** for components - always named exports

### Hooks
- **Custom hooks**: Must start with `use` (e.g., `useRecorder`)
- **Dependencies**: Use exhaustive-deps ESLint rule
- **Memoization**: Use `useMemo`/`useCallback` for expensive computations
- **Context hooks**: Create dedicated hooks for each context (e.g., `useRecordingContext()`)

### Styling
- **Material UI 3** - Use MUI components with Material Design 3
- **Theme access**: Use `useTheme()` hook
- **Custom components**: Extend MUI with styled components
- **Layout**: Use MUI Box, Grid, and Stack components
- **Styling pattern**: Use `sx` prop for one-off styles, styled components for reusable patterns

### State Management
- **Context pattern**: Use React Context + custom hooks (no Redux)
- **State colocation**: Keep state in the component that needs it
- **Performance**: Use `useMemo` and `useCallback` liberally

## 🐉 WebGL & Graphics

### GLRenderer Usage

The `GLRenderer` is the core WebGL engine:

```typescript
const { canvasRef, setCanvasRef, setLut, statsRef, error } = useGLRenderer(
  videoRef,
  streamReady,
  paramsSource,
  drawOverlays
);
```

### Shader Development

Shaders are in `src/engine/shaders/`:
- `.ts` files export GLSL as template strings
- Use tagged template literals (`` glsl`...` ``) for syntax highlighting
- Compile and validate shaders in `GLRenderer.initShaders()`

### Performance Considerations

- **GPU memory**: Always call `dispose()` on GLRenderer cleanup
- **Texture size**: Limit LUT textures to 32x32x32 for performance
- **Shader uniforms**: Minimize uniform updates per frame
- **Canvas size**: Match canvas resolution to video resolution for best performance

## 🚨 Critical Gotchas

### 1. Mock Everything for Tests

When testing components that depend on WebGL, camera, or other browser APIs:

```typescript
// Must mock GLRenderer or tests will fail with shader compilation errors
vi.mock('../engine/GLRenderer', () => ({
  GLRenderer: vi.fn().mockImplementation(() => ({
    initShaders: vi.fn(),
    // ... mock all methods
  }))
}));

// Must mock useGLRenderer or components will crash
vi.mock('../hooks/useGLRenderer', () => ({
  useGLRenderer: vi.fn(() => ({
    canvasRef: { current: null },
    setLut: vi.fn(),
    // ... mock all return values
  }))
}));
```

### 2. Canvas Context Loss

WebGL contexts can be lost at any time. Always handle context loss:

```typescript
const handleContextLost = (event: Event) => {
  event.preventDefault();
  // Stop rendering, show error UI
};

canvas.addEventListener('webglcontextlost', handleContextLost);
```

The `GLRenderer` and hooks handle this automatically - don't manually create WebGL contexts.

### 3. MediaStream Lifecycle

MediaStreams must be properly cleaned up:

```typescript
// Stop all tracks when done
stream.getTracks().forEach(track => track.stop());

// Watch for inactive streams
stream.addEventListener('inactive', () => { /* handle */ });
```

### 4. TypeScript Strict Null Checks

The project has strict null checks enabled. Always handle null/undefined:

```typescript
// Bad
const value = someRef.current.value;

// Good
const value = someRef.current?.value ?? defaultValue;
if (someRef.current) {
  const value = someRef.current.value;
  // ...
}
```

### 5. Component Mount/Unmount

Many components initialize heavy resources (WebGL, Workers, AI models):

```typescript
useEffect(() => {
  // Initialize
  const worker = new Worker(...);
  
  return () => {
    // Cleanup in reverse order
    worker.terminate();
  };
}, []); // Empty deps = mount/unmount only
```

Always check `isMounted` or similar flags in async operations.

### 6. Import Order Matters

Mock ES modules before importing the module under test:

```typescript
// ✅ Correct
vi.mock('./dependency', () => ({ ... }));
import { moduleUnderTest } from './moduleUnderTest';

// ❌ Wrong - mock after import
import { moduleUnderTest } from './moduleUnderTest';
vi.mock('./dependency', () => ({ ... })); // Too late!
```

## 📦 Build & Deployment

### Bundle Size Management

- **Target**: Keep main bundle under 500KB gzipped
- **Strategy**: Heavy code-splitting with React.lazy()
- **Check**: `npm run size-check` enforces limits
- **Tools**: Use `npm run analyze` to visualize bundle

### PWA Configuration

- **Service Worker**: Configured for offline use
- **Assets**: LUTs, WASM, and models cached
- **Updates**: `sw-update.ts` handles service worker updates

### Environment Variables

Use `VITE_` prefix for environment variables:

```bash
VITE_SENTRY_DSN=xxx           # Sentry error tracking
VITE_TELEMETRY_URL=xxx        # Analytics endpoint
VITE_ENV=development|staging|production
```

## 🔧 Debugging

### Debug Logging

Use the convention: `[ClassName] message` for logs:

```typescript
console.log('[GLRenderer] Initializing...');
console.warn('[Camera] Failed to get user media:', error);
```

### Performance Debugging

Use `PerformanceOverlay` component to show:
- FPS counter
- Frame time
- Dropped frames
- Resolution

### WebGL Debugging

Enable WebGL debug contexts in development:

```typescript
// In vite.config.ts
process.env.NODE_ENV === 'development' && 
  canvas.getContext('webgl2', { debug: true });
```

## 📚 Key Documentation

- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System architecture
- [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) - Common issues and solutions
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [README.md](./README.md) - User-facing documentation

## 🎯 Quick Reference

### Most Common Commands
```bash
# Daily development
npm run dev                  # Start dev server
npm run lint:fix             # Fix linting
npm run test                 # Run tests

# Before committing
npm run typecheck            # Type check
npm run lint                 # Lint check
npm run test:coverage        # Full test coverage
npm run build                # Build check
```

### Testing Checklist
- [ ] Mock all external dependencies before importing
- [ ] Use `TestBed` for integration tests
- [ ] Verify WebGL/media mocks are sufficient
- [ ] Check coverage with `npm run test:coverage`

### Before Pushing
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without errors
- [ ] All tests pass
- [ ] Bundle size check passes
- [ ] No `console.log` left in code
- [ ] No unused imports/variables

---

**Last Updated**: $(date)  
**Maintained By**: Development Team  
**Questions?** File an issue or check docs/
