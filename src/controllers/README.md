# Controllers

## Data Flow

```
CameraController (owns stream & videoRef)
       │
       ▼ (via Context)
RenderController (owns GL pipeline & canvasRef)
       │
       ▼ (via Context)
AIController (analyzes frames & emits masks)
RecordingController (captures output from canvasRef)
```

## Event Bus Signals

| Event | Producer | Consumers |
|-------|----------|-----------|
| camera:ready | CameraController | RenderController, AIController |
| camera:error | CameraController | App (Toast) |
| gl:contextlost | RenderController | App (Error UI) |
| ai:result | AIController | RenderController (Auto params) |
| ai:masks | AIController | RenderController (Beauty masks) |
| ai:landmarks | AIController | RenderController (Face/Mouth center) |
| recording:start | RecordingController | RenderController (UI state) |
| recording:stop | RecordingController | MediaLibrary |
| recording:toggle | RenderController (Viewfinder UI) | RecordingController |
| recording:snapshot | RenderController (Viewfinder UI) | RecordingController |

## Rules

1. Controllers don't import each other directly (except for Context consumption where hierarchy permits).
2. All cross-controller communication via EventBus or shared Contexts.
3. Each controller owns cleanup for its resources.
4. UI components read state via context, not prop drilling.
