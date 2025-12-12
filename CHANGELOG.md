# Changelog

## [1.0.0-phase0] - 2024-02-14

### Production Readiness
- **Test Coverage**: 58% (up from 37%)
- **Test Count**: 335 passing tests
- **Bundle Size**: 282KB (Main Chunk)

### Changed
- Refactored App.tsx into modular controllers (Camera, Render, AI, Recording)
- Improved resource cleanup and disposal across all services
- Updated AI analysis to clearly label as heuristic-based
- Virtual camera now shows setup wizard with browser-specific instructions
- LUT service uses LRU cache (max 5 LUTs)

### Fixed
- Memory leaks from undisposed resources
- WebGL context loss recovery
- Settings migration for schema changes

### Added
- EventBus for cross-module communication
- Performance mode toggle (Auto/High/Medium/Low)
- Adaptive quality system with automatic tier switching
- Memory usage monitoring
- Telemetry service for errors and performance
- A/B wipe comparison (before/after slider)
- Vectorscope with skin tone line
- De-esser and brickwall limiter in audio chain
- Comprehensive test suite (335 tests)

## [1.0.0] - Initial Release

- WebGL2 color grading pipeline
- ~30 professional LUTs
- MediaPipe face detection
- Recording and photo capture
- Virtual camera output via window sharing
- PWA support
- MIDI controller mapping
