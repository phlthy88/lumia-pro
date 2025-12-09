# Lumia Pro Refactor: Sprint 4 - Docs, DX, Release Safety

## Prerequisites

Sprints 1-3 complete:
- Architecture refactored and tested
- Performance optimized
- Virtual cam hardened
- AI honestly labeled

## Goal

Polish documentation, improve developer experience, and establish release safety practices.

## Tasks

### 1. Architecture documentation

Create `docs/ARCHITECTURE.md`:

```markdown
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

⚠️ = Partial support, see BROWSER_COMPATIBILITY.md
```

### 2. Migration documentation

Create `docs/MIGRATION.md`:

```markdown
# Migration Guide

## Settings Migration

User settings are stored in localStorage with schema versioning.

### Current Schema (v1)

```typescript
interface Settings {
  version: 1;
  data: {
    camera_id?: string;
    theme_mode?: 'light' | 'dark';
    seed_color?: string;
    sidebar_position?: 'left' | 'right';
    // ... other settings
  };
}
```

### Adding a Migration

1. Increment `CURRENT_VERSION` in `SettingsMigration.ts`
2. Add migration logic:

```typescript
if (version < 2) {
  // v1 -> v2: Rename 'camera_id' to 'activeDeviceId'
  if (data.camera_id) {
    data.activeDeviceId = data.camera_id;
    delete data.camera_id;
  }
  console.log('[Settings] Migrated v1 -> v2');
}
```

3. Test with old settings in localStorage

### Breaking Changes

If a migration cannot preserve data:
1. Log clear warning
2. Reset to defaults
3. Show user notification on first load
```

### 3. Troubleshooting documentation

Create `docs/TROUBLESHOOTING.md`:

```markdown
# Troubleshooting

## Camera Issues

### "Camera permission denied"
- Check browser permissions (click lock icon in address bar)
- Ensure no other app is using the camera
- Try refreshing the page

### "Camera not found"
- Verify camera is connected
- Check Device Manager (Windows) or System Preferences (Mac)
- Try a different USB port

### Camera shows black screen
- Some cameras need a moment to warm up
- Try switching resolution
- Check if camera works in other apps

## Performance Issues

### Low FPS / Stuttering
- Switch to "Low" quality mode in settings
- Disable beauty effects
- Close other browser tabs
- Check if hardware acceleration is enabled in browser

### High memory usage
- Enable "Low Memory Mode" in settings
- Reduce number of LUTs loaded
- Restart the app periodically during long sessions

### WebGL context lost
- Usually caused by GPU driver issues
- App will attempt auto-recovery
- If persistent, try updating GPU drivers

## Virtual Camera Issues

### Popup blocked
- Allow popups for this site in browser settings
- Look for popup blocker icon in address bar

### Virtual cam not showing in Zoom/Meet
- Use "Share Screen" > "Window" > Select Lumia Pro window
- This is window sharing, not a system virtual camera

### OBS integration
- Use "Window Capture" source
- Select the Lumia Pro virtual camera window

## Recording Issues

### Recording fails to start
- Check available disk space
- Try a lower bitrate setting
- Ensure microphone permissions if recording audio

### Recording file corrupted
- Don't close browser during recording
- Avoid switching tabs during long recordings
- Try shorter recording segments

## Getting Help

1. Check browser console for errors (F12 > Console)
2. Note your browser version and OS
3. Open an issue on GitHub with reproduction steps
```

### 4. Contributing guide

Create `CONTRIBUTING.md`:

```markdown
# Contributing to Lumia Pro

## Development Setup

```bash
git clone https://github.com/phlthy88/lumia-pro.git
cd lumia-pro
npm install
npm run dev
```

## Code Style

- TypeScript strict mode
- ESLint enforced
- Prettier for formatting (run `npm run format` if configured)

## Testing

### Unit Tests
```bash
npm run test           # Run once
npm run test:ui        # Interactive UI
npm run test:coverage  # With coverage report
```

### E2E Tests
```bash
npx playwright install  # First time only
npx playwright test     # Run all
npx playwright test --ui # Interactive mode
```

### Performance Testing
```bash
npm run build
npm run analyze  # Bundle size analysis
```

## Test Matrix

Before submitting PR, verify:

| Test | Command | Pass Criteria |
|------|---------|---------------|
| Types | `npm run typecheck` | No errors |
| Lint | `npx eslint src` | No errors |
| Unit | `npm test -- --run` | All pass |
| E2E | `npx playwright test` | All pass |
| Build | `npm run build` | Completes |
| Bundle | Check dist/ size | < 2.5MB gzip |

## Architecture Rules

1. Controllers don't import each other
2. Cross-module communication via EventBus
3. All services implement `dispose()`
4. Hooks clean up in useEffect return

## Pull Request Process

1. Create feature branch from `main`
2. Make changes with clear commits
3. Run full test matrix
4. Update docs if needed
5. Open PR with description of changes
6. Address review feedback

## Performance Benchmarks

When changing render pipeline or adding features:

1. Measure baseline FPS before changes
2. Measure after changes
3. Include in PR description:
   - FPS impact (if any)
   - Memory impact (if any)
   - Bundle size change
```

### 5. Release checklist

Create `docs/RELEASE_CHECKLIST.md`:

```markdown
# Release Checklist

## Pre-Release

- [ ] All tests passing (`npm test -- --run`)
- [ ] E2E tests passing (`npx playwright test`)
- [ ] TypeScript clean (`npm run typecheck`)
- [ ] No ESLint errors
- [ ] Bundle size within budget (< 2.5MB gzip)
- [ ] Performance baseline met (> 24 FPS on mid-tier)
- [ ] Memory stable (< 400MB idle after 5 min)

## Documentation

- [ ] README reflects current features
- [ ] CHANGELOG updated
- [ ] Migration guide updated (if schema changed)
- [ ] Troubleshooting updated (if new error cases)

## Testing

- [ ] Manual test: fresh install flow
- [ ] Manual test: camera → LUT → record → playback
- [ ] Manual test: virtual camera in Zoom/Meet
- [ ] Manual test: settings persist across reload
- [ ] Test on Chrome, Firefox, Edge
- [ ] Test on low-end device (if available)

## Deployment

- [ ] Version bumped in package.json
- [ ] Git tag created
- [ ] Build succeeds in CI
- [ ] Deploy to staging (if available)
- [ ] Smoke test staging
- [ ] Deploy to production

## Post-Release

- [ ] Monitor Sentry for new errors
- [ ] Check analytics for crash rate
- [ ] Respond to user issues within 48h

## Rollback Plan

If critical issues found:

1. Revert to previous git tag
2. Redeploy previous version
3. Communicate to users if needed
4. Create hotfix branch for fix
```

### 6. Update README

Ensure `README.md` accurately reflects:

- Actual LUT count (~30, not 70+)
- AI is "heuristic-based" not "Gemini-powered"
- Virtual camera works via window sharing
- Browser compatibility notes

### 7. Add CHANGELOG

Create `CHANGELOG.md`:

```markdown
# Changelog

## [Unreleased]

### Changed
- Refactored App.tsx into modular controllers
- Improved resource cleanup and disposal
- Updated AI analysis to clearly label as heuristic-based
- Virtual camera now shows setup wizard

### Fixed
- Memory leaks from undisposed resources
- WebGL context loss recovery
- Settings migration for schema changes

### Added
- EventBus for cross-module communication
- Performance mode toggle (Auto/High/Medium/Low)
- Memory usage monitoring
- Telemetry for errors and performance

## [1.0.0] - Previous Release

Initial release with:
- WebGL2 color grading pipeline
- 30+ professional LUTs
- MediaPipe face detection
- Recording and photo capture
- Virtual camera output
- PWA support
```

## Files to create

- `docs/ARCHITECTURE.md`
- `docs/MIGRATION.md`
- `docs/TROUBLESHOOTING.md`
- `CONTRIBUTING.md`
- `docs/RELEASE_CHECKLIST.md`
- `CHANGELOG.md`

## Files to modify

- `README.md` (accuracy pass)

## Success criteria

1. New developer can understand architecture from docs
2. Users can self-serve common issues via troubleshooting
3. Release process is documented and repeatable
4. README matches actual capabilities
5. CHANGELOG tracks all changes from refactor
