# Lumia Pro Refactor: Sprint 1b - Shell Decomposition

## Prerequisites

Sprint 1a must be complete:
- All dispose() methods implemented
- README updated
- Settings migration in place
- Smoke tests passing

## Goal

Split the monolithic `src/App.tsx` (~48KB) into focused controllers/providers while maintaining functionality.

## Architecture

Create this structure:

```
src/
├── controllers/
│   ├── CameraController.tsx
│   ├── RenderController.tsx
│   ├── AIController.tsx
│   └── RecordingController.tsx
├── providers/
│   ├── UIStateProvider.tsx
│   └── EventBus.ts
└── App.tsx (thin shell that composes controllers)
```

## Tasks

### 1. Create EventBus

Create `src/providers/EventBus.ts` - typed EventTarget wrapper for cross-module signals:

```typescript
type EventMap = {
  'camera:ready': { deviceId: string };
  'camera:error': { error: Error };
  'gl:contextlost': void;
  'gl:contextrestored': void;
  'ai:result': { params: Partial<ColorGradeParams> };
  'virtualcam:status': { active: boolean };
  'recording:start': void;
  'recording:stop': { blob: Blob };
  'memory:warning': { usedMB: number };
};

class TypedEventBus {
  private target = new EventTarget();

  emit<K extends keyof EventMap>(type: K, detail: EventMap[K]): void {
    this.target.dispatchEvent(new CustomEvent(type, { detail }));
  }

  on<K extends keyof EventMap>(type: K, handler: (detail: EventMap[K]) => void): () => void {
    const listener = (e: Event) => handler((e as CustomEvent).detail);
    this.target.addEventListener(type, listener);
    return () => this.target.removeEventListener(type, listener);
  }
}

export const eventBus = new TypedEventBus();
```

### 2. Create UIStateProvider

Create `src/providers/UIStateProvider.tsx`:

Owns:
- Active tab state
- Toast/snackbar queue
- Keyboard shortcuts registration
- Sidebar position
- Theme mode (delegate to existing ThemeContext)

```typescript
interface UIState {
  activeTab: number;
  setActiveTab: (tab: number) => void;
  showToast: (message: string, severity?: 'success' | 'error' | 'info') => void;
  sidebarPosition: 'left' | 'right';
  setSidebarPosition: (pos: 'left' | 'right') => void;
}
```

Extract keyboard shortcut logic from App.tsx into this provider.

### 3. Create CameraController

Create `src/controllers/CameraController.tsx`:

Owns:
- `useCameraStream` hook
- Device selection state
- Resolution/FPS selection
- Permission handling
- Camera error display

Props out:
- `videoRef` for RenderController
- `streamReady` boolean
- `deviceList`, `activeDeviceId`, `setActiveDeviceId`

Emits via eventBus:
- `camera:ready` when stream starts
- `camera:error` on failure

### 4. Create RenderController

Create `src/controllers/RenderController.tsx`:

Owns:
- `useGLRenderer` hook
- `useOverlays` hook
- `useColorGrading` hook
- LUT loading and selection
- Render mode switching (Standard, Focus Peaking, Zebras, etc.)
- Beauty mask integration
- Stats overlay

Props in:
- `videoRef` from CameraController

Listens via eventBus:
- `camera:ready` to start render loop
- `ai:result` to apply auto params

Emits:
- `gl:contextlost`, `gl:contextrestored`

### 5. Create AIController

Create `src/controllers/AIController.tsx`:

Owns:
- `useAIAnalysis` hook
- `useVisionWorker` hook
- `MaskGenerator` instance
- Beauty config state
- Auto-analysis trigger

Props in:
- `videoRef` from CameraController
- `canvasRef` from RenderController (for analysis)

Emits:
- `ai:result` with suggested params

### 6. Create RecordingController

Create `src/controllers/RecordingController.tsx`:

Owns:
- `useRecorder` hook
- Recording state (idle, countdown, recording)
- Photo capture
- Thumbnail generation
- Media library integration

Props in:
- `canvasRef` from RenderController

Emits:
- `recording:start`, `recording:stop`

### 7. Refactor App.tsx

Reduce App.tsx to a thin composition shell:

```typescript
export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <ThemeProvider>
      <UIStateProvider>
        <ErrorBoundary>
          <AppLayout>
            <CameraController videoRef={videoRef} />
            <RenderController videoRef={videoRef} canvasRef={canvasRef} />
            <AIController videoRef={videoRef} canvasRef={canvasRef} />
            <RecordingController canvasRef={canvasRef} />
            {/* Sidebar panels rendered based on UIState.activeTab */}
          </AppLayout>
        </ErrorBoundary>
      </UIStateProvider>
    </ThemeProvider>
  );
}
```

### 8. Document boundaries

Add `src/controllers/README.md`:

```markdown
# Controllers

## Data Flow

```
CameraController (owns stream)
       │
       ▼ videoRef
RenderController (owns GL pipeline)
       │
       ▼ canvasRef
AIController (analyzes frames)
RecordingController (captures output)
```

## Event Bus Signals

| Event | Producer | Consumers |
|-------|----------|-----------|
| camera:ready | CameraController | RenderController |
| gl:contextlost | RenderController | App (error UI) |
| ai:result | AIController | RenderController |
| recording:stop | RecordingController | MediaLibrary |

## Rules

1. Controllers don't import each other directly
2. All cross-controller communication via eventBus or shared refs
3. Each controller owns cleanup for its resources
4. UI components read state via context, not prop drilling
```

## Files to create

- `src/providers/EventBus.ts`
- `src/providers/UIStateProvider.tsx`
- `src/controllers/CameraController.tsx`
- `src/controllers/RenderController.tsx`
- `src/controllers/AIController.tsx`
- `src/controllers/RecordingController.tsx`
- `src/controllers/README.md`

## Files to modify

- `src/App.tsx` (reduce to shell)

## Constraints

- Do NOT change render pipeline logic
- Do NOT change hook implementations (only move where they're called)
- Preserve all existing functionality
- No new dependencies
- Run `npm run typecheck` after each controller

## Migration approach

1. Create EventBus and UIStateProvider first
2. Extract one controller at a time, test after each
3. Keep App.tsx working throughout—never break the app
4. Final step: delete dead code from App.tsx

## Success criteria

1. App.tsx < 200 lines
2. Each controller < 400 lines
3. All existing E2E tests pass
4. No functionality regression
5. Clear separation of concerns documented
