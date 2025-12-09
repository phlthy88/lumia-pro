# Lumia Pro Architecture

## Overview

Lumia Pro is a browser-based video processing application built with React, TypeScript, and WebGL2.

## Module Structure

```
src/
├── controllers/     # Feature orchestration
│   ├── CameraController.tsx    # Camera stream management
│   ├── RenderController.tsx    # WebGL pipeline
│   ├── AIController.tsx        # Analysis & beauty
│   └── RecordingController.tsx # Capture & media
├── providers/       # Shared state & communication
│   ├── UIStateProvider.tsx     # UI state context
│   └── EventBus.ts             # Cross-module signals
├── engine/          # Core rendering
│   ├── GLRenderer.ts           # WebGL2 renderer
│   ├── AdaptiveQuality.ts      # Performance scaling
│   └── GPUCapabilities.ts      # Hardware detection
├── services/        # Business logic
│   ├── LutService.ts           # LUT loading & caching
│   ├── VirtualCameraService.ts # Virtual cam output
│   └── AIAnalysisService.ts    # Frame analysis
├── hooks/           # React hooks
│   ├── useCameraStream.ts      # Camera access
│   ├── useRecorder.ts          # MediaRecorder
│   └── useVisionWorker.ts      # Face detection
├── beauty/          # Beauty effects
│   └── MaskGenerator.ts        # Face mask generation
└── components/      # UI components
```

## Data Flow

```
┌─────────────────┐
│ CameraController│ ──── videoRef ────┐
└────────┬────────┘                   │
         │ camera:ready               ▼
         │                   ┌─────────────────┐
         └──────────────────▶│ RenderController│
                             │   (GLRenderer)  │
         ┌───────────────────┤                 │
         │ canvasRef         └────────┬────────┘
         ▼                            │
┌─────────────────┐                   │ gl:contextlost
│  AIController   │◀── ai:result ─────┘
│ (analysis/masks)│
└─────────────────┘
         │
         │ canvasRef
         ▼
┌─────────────────┐
│RecordingController│
│ (capture/record)  │
└───────────────────┘
```

## Event Bus Signals

| Event | Payload | Producer | Consumers |
|-------|---------|----------|-----------|
| camera:ready | { deviceId } | CameraController | RenderController |
| camera:error | { error } | CameraController | App (error UI) |
| gl:contextlost | void | RenderController | App, Telemetry |
| gl:contextrestored | void | RenderController | App |
| ai:result | { params } | AIController | RenderController |
| recording:start | void | RecordingController | UI |
| recording:stop | { blob } | RecordingController | MediaLibrary |
| memory:warning | { usedMB } | MemoryMonitor | UI, Telemetry |

## Resource Lifecycle

All services and controllers implement cleanup:

1. **GLRenderer**: `dispose()` releases textures, buffers, RAF, listeners
2. **VirtualCameraService**: `dispose()` stops tracks, closes popout, channel
3. **AIAnalysisService**: `dispose()` clears canvas refs
4. **Hooks**: useEffect cleanup stops streams, removes listeners

## Performance Tiers

| Tier | Resolution Scale | Target FPS | Beauty | Trigger |
|------|------------------|------------|--------|---------|
| High | 1.0 | 60 | Yes | Default |
| Medium | 0.75 | 30 | Yes | FPS < 30 |
| Low | 0.5 | 30 | No | FPS < 20 |

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| WebGL2 | ✅ | ✅ | ✅ | ✅ |
| MediaPipe | ✅ | ✅ | ⚠️ | ✅ |
| Virtual Cam | ✅ | ✅ | ⚠️ | ✅ |
| Recording | ✅ | ✅ | ⚠️ | ✅ |

⚠️ = Partial support, see [BROWSER_COMPATIBILITY.md](./BROWSER_COMPATIBILITY.md)
