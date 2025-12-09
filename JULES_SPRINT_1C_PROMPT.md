# Lumia Pro Refactor: Sprint 1c - Tests & Guardrails

## Prerequisites

Sprint 1b must be complete:
- App.tsx decomposed into controllers
- EventBus implemented
- All controllers functional
- No regressions

## Goal

Add comprehensive tests and telemetry to validate the refactored architecture.

## Tasks

### 1. Vitest: Disposer tests

Create `src/engine/__tests__/GLRenderer.dispose.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('GLRenderer disposal', () => {
  it('releases all textures on dispose', () => {
    // Mock WebGL2 context
    // Create renderer, add textures
    // Call dispose()
    // Assert deleteTexture called for each texture
  });

  it('cancels animation frame on dispose', () => {
    // Assert cancelAnimationFrame called
  });

  it('removes context lost listener on dispose', () => {
    // Assert removeEventListener called
  });

  it('handles dispose when already stopped', () => {
    // Call dispose twice, no errors
  });
});
```

Create `src/services/__tests__/VirtualCameraService.dispose.test.ts`:

```typescript
describe('VirtualCameraService disposal', () => {
  it('stops all tracks on dispose', () => {});
  it('closes popout window on dispose', () => {});
  it('closes BroadcastChannel on dispose', () => {});
  it('cancels RAF on dispose', () => {});
});
```

Create `src/services/__tests__/AIAnalysisService.dispose.test.ts`:

```typescript
describe('AIAnalysisService disposal', () => {
  it('clears canvas references on dispose', () => {});
  it('is safe to call multiple times', () => {});
});
```

### 2. Vitest: Controller wiring tests

Create `src/controllers/__tests__/CameraController.test.tsx`:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { CameraController } from '../CameraController';
import { eventBus } from '../../providers/EventBus';

describe('CameraController', () => {
  it('emits camera:ready when stream starts', async () => {
    const handler = vi.fn();
    const unsub = eventBus.on('camera:ready', handler);
    
    // Mock getUserMedia
    // Render controller
    // Wait for stream
    
    await waitFor(() => expect(handler).toHaveBeenCalled());
    unsub();
  });

  it('emits camera:error on permission denied', async () => {
    // Mock getUserMedia rejection
  });

  it('cleans up stream on unmount', async () => {
    // Render, then unmount
    // Assert tracks stopped
  });
});
```

Create similar tests for RenderController, AIController, RecordingController.

### 3. Vitest: AIAnalysis determinism

Create `src/services/__tests__/AIAnalysisService.determinism.test.ts`:

```typescript
describe('AIAnalysisService determinism', () => {
  it('returns consistent results for identical frames', () => {
    // Create test canvas with known pixel values
    // Run analysis twice
    // Assert results match exactly
  });

  it('detects underexposed frame', () => {
    // Dark frame -> suggests positive exposure adjustment
  });

  it('detects overexposed frame', () => {
    // Bright frame -> suggests negative exposure adjustment
  });

  it('detects color cast', () => {
    // Blue-tinted frame -> suggests warm temperature adjustment
  });
});
```

### 4. Vitest: EventBus tests

Create `src/providers/__tests__/EventBus.test.ts`:

```typescript
describe('EventBus', () => {
  it('delivers events to subscribers', () => {});
  it('unsubscribe stops delivery', () => {});
  it('handles multiple subscribers', () => {});
  it('type-checks event payloads', () => {
    // This is compile-time, but document expected types
  });
});
```

### 5. GLSL shader compilation tests

Create `src/engine/__tests__/shaders.compile.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Read shader source from GLRenderer or separate files
const VERTEX_SHADER = `...`; // Extract from GLRenderer
const FRAGMENT_SHADER = `...`;

describe('Shader compilation', () => {
  it('vertex shader has valid GLSL syntax', () => {
    // Use a GLSL parser/validator if available
    // Or just check for common syntax errors
    expect(VERTEX_SHADER).toContain('gl_Position');
    expect(VERTEX_SHADER).not.toContain('syntax error');
  });

  it('fragment shader has valid GLSL syntax', () => {
    expect(FRAGMENT_SHADER).toContain('gl_FragColor');
  });

  it('all uniforms are declared', () => {
    // Check that uniforms used in fragment shader are declared
    const uniformPattern = /uniform\s+\w+\s+(\w+)/g;
    const uniforms = [...FRAGMENT_SHADER.matchAll(uniformPattern)].map(m => m[1]);
    // Assert expected uniforms present
  });
});
```

### 6. Playwright E2E flows

Update `e2e/critical-paths.spec.ts` or create `e2e/refactor-validation.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Post-refactor validation', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['camera', 'microphone']);
    await page.goto('/');
    await page.waitForSelector('canvas', { state: 'visible', timeout: 10000 });
  });

  test('camera start/stop cycle', async ({ page }) => {
    // Verify camera starts
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Switch camera if multiple available
    // Stop and restart
    // No errors in console
  });

  test('virtual cam popout lifecycle', async ({ page, context }) => {
    // Click virtual cam button
    // Wait for popout window
    // Close popout
    // Verify main app still functional
    // No orphaned streams
  });

  test('AI autofix applies params', async ({ page }) => {
    // Navigate to AI tab
    // Click analyze/autofix
    // Verify color params changed
  });

  test('recording flow', async ({ page }) => {
    // Start recording
    // Wait 2 seconds
    // Stop recording
    // Verify media appears in library
  });

  test('LUT application', async ({ page }) => {
    // Select a LUT
    // Verify canvas renders (screenshot comparison optional)
  });

  test('no memory leak on tab switching', async ({ page }) => {
    // Get initial memory
    // Switch tabs 20 times
    // Get final memory
    // Assert growth < 50MB
  });

  test('cleanup on page unload', async ({ page }) => {
    // Navigate away
    // Check no console errors about orphaned resources
  });
});
```

### 7. Telemetry hooks

Create `src/services/Telemetry.ts`:

```typescript
import * as Sentry from '@sentry/react';

export const Telemetry = {
  contextLost(): void {
    console.warn('[Telemetry] WebGL context lost');
    Sentry.captureMessage('WebGL context lost', 'warning');
  },

  contextRestored(): void {
    console.info('[Telemetry] WebGL context restored');
  },

  permissionDenied(type: 'camera' | 'microphone'): void {
    console.warn(`[Telemetry] ${type} permission denied`);
    Sentry.captureMessage(`${type} permission denied`, 'info');
  },

  disposalFailure(service: string, error: Error): void {
    console.error(`[Telemetry] ${service} disposal failed`, error);
    Sentry.captureException(error, { tags: { service, phase: 'disposal' } });
  },

  memoryWarning(usedMB: number): void {
    console.warn(`[Telemetry] High memory usage: ${usedMB}MB`);
    Sentry.captureMessage(`High memory: ${usedMB}MB`, 'warning');
  },
};
```

Wire into:
- GLRenderer context loss handler
- CameraController permission errors
- All dispose() catch blocks
- useMemoryMonitor threshold

## Files to create

- `src/engine/__tests__/GLRenderer.dispose.test.ts`
- `src/engine/__tests__/shaders.compile.test.ts`
- `src/services/__tests__/VirtualCameraService.dispose.test.ts`
- `src/services/__tests__/AIAnalysisService.dispose.test.ts`
- `src/services/__tests__/AIAnalysisService.determinism.test.ts`
- `src/controllers/__tests__/CameraController.test.tsx`
- `src/controllers/__tests__/RenderController.test.tsx`
- `src/controllers/__tests__/AIController.test.tsx`
- `src/controllers/__tests__/RecordingController.test.tsx`
- `src/providers/__tests__/EventBus.test.ts`
- `src/services/Telemetry.ts`
- `e2e/refactor-validation.spec.ts`

## Files to modify

- `src/engine/GLRenderer.ts` (add Telemetry calls)
- `src/controllers/CameraController.tsx` (add Telemetry calls)
- `src/hooks/useMemoryMonitor.ts` (add Telemetry calls)

## Constraints

- Tests should be fast (<30s total for Vitest)
- E2E tests should be reliable (no flaky waits)
- Telemetry should be non-blocking (fire and forget)
- No new dependencies except dev dependencies for testing

## Success criteria

1. `npm run test` passes with >70% coverage on new code
2. `npx playwright test` passes all new E2E flows
3. Telemetry fires correctly (verify in Sentry dashboard or console)
4. No flaky tests after 3 consecutive runs
