# Performance Baseline

## Test Environment
- Browser: Chrome 120+
- Device: Mid-tier laptop (Intel i5, integrated GPU)
- Resolution: 1080p camera input

## Metrics (Target Values)

| Metric | Target | Notes |
|--------|--------|-------|
| Cold start to interactive | <3000ms | Time until canvas renders |
| Time to first frame | <2000ms | Camera permission + first render |
| Steady-state FPS (no effects) | >30 | Standard mode |
| Steady-state FPS (LUT + beauty) | >24 | Full processing |
| Idle memory (no recording) | <400MB | After 1 min stabilization |
| Memory after 5min recording | <600MB | With continuous recording |
| Bundle size (gzip) | <2500KB | Production build |

## MediaPipe Overhead
- WASM load time: ~500ms (first load, cached after)
- Face detection per frame: ~15-30ms
- Memory footprint: ~50-100MB when active

## Quality Tiers

| Tier | Resolution Scale | Target FPS | Beauty | Trigger |
|------|------------------|------------|--------|---------|
| High | 1.0 | 60 | Yes | Default, FPS > 30 |
| Medium | 0.75 | 30 | Yes | FPS 20-30 |
| Low | 0.5 | 30 | No | FPS < 20 |

## Measurement Instructions

### FPS Measurement
1. Open DevTools > Performance
2. Start recording
3. Wait 10 seconds with effects enabled
4. Stop and check frame rate in summary

### Memory Measurement
1. Open DevTools > Memory
2. Take heap snapshot
3. Note "Retained Size" total
4. Repeat after 5 minutes of use

### Bundle Size
```bash
npm run build
ls -la dist/assets/*.js | awk '{sum+=$5} END {print sum/1024 "KB"}'
```

## Optimization Checklist
- [x] Lazy load MediaPipe (only when beauty enabled)
- [x] LUT LRU cache (max 5 entries)
- [x] AdaptiveQuality with tier recommendations
- [x] PerformanceModeToggle component
- [x] Bundle analysis script (`npm run analyze`)
- [x] FPS regression E2E test
- [ ] Wire PerformanceModeToggle into UI (RenderSettings)
