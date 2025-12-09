# Lumia Pro Refactor: Sprint 2 - Performance & Assets

## Prerequisites

Sprint 1 complete:
- Controllers decomposed and tested
- Disposal patterns working
- No memory leaks
- Telemetry in place

## Goal

Measure baseline performance, optimize asset loading, and wire adaptive quality into UI.

## Tasks

### 1. Measure baseline performance

Create `docs/PERFORMANCE_BASELINE.md` with measurements:

```markdown
# Performance Baseline (measured [DATE])

## Test Environment
- Browser: Chrome [version]
- Device: [CPU/GPU/RAM]
- Resolution: 1080p camera input

## Metrics

| Metric | Value | Target |
|--------|-------|--------|
| Cold start to interactive | Xms | <3000ms |
| Time to first frame | Xms | <2000ms |
| Steady-state FPS (no effects) | X | >30 |
| Steady-state FPS (LUT + beauty) | X | >24 |
| Idle memory (no recording) | XMB | <400MB |
| Memory after 5min recording | XMB | <600MB |
| Bundle size (gzip) | XKB | <2500KB |

## MediaPipe overhead
- WASM load time: Xms
- Face detection per frame: Xms
- Memory footprint: XMB
```

Use DevTools Performance/Memory tabs and `performance.now()` instrumentation.

### 2. Lazy-load LUTs

Modify `src/services/LutService.ts`:

```typescript
// Current: LUTs loaded eagerly or on-demand but cached forever
// Change: Load on-demand with LRU cache

const LUT_CACHE_MAX = 5; // Keep only 5 most recent LUTs in memory
const lutCache = new Map<string, LutData>();
const lutAccessOrder: string[] = [];

export async function loadLut(url: string, name: string): Promise<LutData> {
  if (lutCache.has(url)) {
    // Move to end of access order
    const idx = lutAccessOrder.indexOf(url);
    if (idx > -1) lutAccessOrder.splice(idx, 1);
    lutAccessOrder.push(url);
    return lutCache.get(url)!;
  }

  const lut = await LutService.loadFromUrl(url, name);
  
  // Evict oldest if at capacity
  if (lutCache.size >= LUT_CACHE_MAX) {
    const oldest = lutAccessOrder.shift();
    if (oldest) {
      lutCache.delete(oldest);
      console.log(`[LutService] Evicted ${oldest} from cache`);
    }
  }

  lutCache.set(url, lut);
  lutAccessOrder.push(url);
  return lut;
}

export function clearLutCache(): void {
  lutCache.clear();
  lutAccessOrder.length = 0;
}
```

### 3. Lazy-load MediaPipe model

Modify `src/hooks/useVisionWorker.ts`:

```typescript
// Only load face_landmarker.task when beauty effects are first enabled
// Not on app startup

const [modelLoaded, setModelLoaded] = useState(false);

const loadModel = useCallback(async () => {
  if (modelLoaded) return;
  // Load model
  setModelLoaded(true);
}, [modelLoaded]);

// Trigger load when beauty.enabled becomes true
useEffect(() => {
  if (beautyEnabled && !modelLoaded) {
    loadModel();
  }
}, [beautyEnabled, modelLoaded, loadModel]);
```

### 4. Free buffers after GPU upload

Modify `src/engine/GLRenderer.ts` in `setLut()`:

```typescript
public setLut(lut: LutData) {
  // ... existing texture upload code ...

  // After successful upload, allow GC of CPU-side data
  // The Float32Array is no longer needed once in GPU memory
  // Note: This only works if caller doesn't need the data anymore
  
  // Signal that upload is complete
  console.log(`[GLRenderer] LUT uploaded, CPU buffer can be released`);
}
```

Modify LUT loading flow to not retain `data` array after upload:

```typescript
// In RenderController or wherever LUT is applied
const lut = await loadLut(url, name);
renderer.setLut(lut);
// Don't store lut.data in state - let it GC
```

### 5. Adaptive quality signals

Modify `src/engine/AdaptiveQuality.ts`:

```typescript
export interface QualityState {
  tier: 'high' | 'medium' | 'low';
  resolutionScale: number;
  targetFps: number;
  beautyEnabled: boolean;
  reason?: string;
}

export class AdaptiveQuality {
  private frameTimesMs: number[] = [];
  private readonly windowSize = 60; // 1 second at 60fps
  
  addFrameTime(ms: number): void {
    this.frameTimesMs.push(ms);
    if (this.frameTimesMs.length > this.windowSize) {
      this.frameTimesMs.shift();
    }
  }

  getRecommendation(): QualityState {
    if (this.frameTimesMs.length < 30) {
      return { tier: 'high', resolutionScale: 1.0, targetFps: 60, beautyEnabled: true };
    }

    const avgMs = this.frameTimesMs.reduce((a, b) => a + b, 0) / this.frameTimesMs.length;
    const avgFps = 1000 / avgMs;

    if (avgFps < 20) {
      return { 
        tier: 'low', 
        resolutionScale: 0.5, 
        targetFps: 30, 
        beautyEnabled: false,
        reason: `Low FPS: ${avgFps.toFixed(1)}`
      };
    }
    
    if (avgFps < 30) {
      return { 
        tier: 'medium', 
        resolutionScale: 0.75, 
        targetFps: 30, 
        beautyEnabled: true,
        reason: `Medium FPS: ${avgFps.toFixed(1)}`
      };
    }

    return { tier: 'high', resolutionScale: 1.0, targetFps: 60, beautyEnabled: true };
  }

  reset(): void {
    this.frameTimesMs = [];
  }
}
```

### 6. Performance mode UI

Create `src/components/PerformanceModeToggle.tsx`:

```typescript
interface Props {
  currentTier: 'high' | 'medium' | 'low' | 'auto';
  onTierChange: (tier: 'high' | 'medium' | 'low' | 'auto') => void;
  recommendation?: QualityState;
}

export function PerformanceModeToggle({ currentTier, onTierChange, recommendation }: Props) {
  return (
    <Box>
      <ToggleButtonGroup value={currentTier} exclusive onChange={(_, v) => v && onTierChange(v)}>
        <ToggleButton value="auto">Auto</ToggleButton>
        <ToggleButton value="high">High</ToggleButton>
        <ToggleButton value="medium">Medium</ToggleButton>
        <ToggleButton value="low">Low</ToggleButton>
      </ToggleButtonGroup>
      
      {currentTier === 'auto' && recommendation && (
        <Typography variant="caption">
          Current: {recommendation.tier} ({recommendation.reason})
        </Typography>
      )}
    </Box>
  );
}
```

Wire into RenderController and expose in Output or Camera tab.

### 7. Bundle analysis

Add to `package.json` scripts:

```json
{
  "scripts": {
    "analyze": "vite build --mode production && npx vite-bundle-visualizer"
  }
}
```

Run and document largest chunks. Target reductions:
- Split MediaPipe into separate chunk (only load when needed)
- Ensure MUI tree-shaking is working
- Check for duplicate dependencies

### 8. Performance regression test

Add to `e2e/critical-paths.spec.ts`:

```typescript
test('maintains 24+ FPS under load', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas');
  
  // Enable LUT + beauty
  // Wait 5 seconds for stabilization
  
  const fps = await page.evaluate(() => {
    return new Promise<number>(resolve => {
      let frames = 0;
      const start = performance.now();
      
      const count = () => {
        frames++;
        if (performance.now() - start < 3000) {
          requestAnimationFrame(count);
        } else {
          resolve(frames / 3);
        }
      };
      requestAnimationFrame(count);
    });
  });
  
  expect(fps).toBeGreaterThan(24);
});
```

## Files to create

- `docs/PERFORMANCE_BASELINE.md`
- `src/components/PerformanceModeToggle.tsx`

## Files to modify

- `src/services/LutService.ts` (LRU cache)
- `src/hooks/useVisionWorker.ts` (lazy model load)
- `src/engine/GLRenderer.ts` (buffer release logging)
- `src/engine/AdaptiveQuality.ts` (quality recommendations)
- `src/controllers/RenderController.tsx` (wire adaptive quality)
- `package.json` (analyze script)
- `e2e/critical-paths.spec.ts` (FPS test)

## Success criteria

1. Baseline documented with actual measurements
2. LUT cache limited to 5 entries
3. MediaPipe model loads only when beauty enabled
4. Adaptive quality recommends tier based on FPS
5. UI toggle for manual quality override
6. Bundle size documented, no regressions
7. FPS test passes in CI
