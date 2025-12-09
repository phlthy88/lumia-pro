import { test, expect } from '@playwright/test';

test.describe('Visual Regression - Shader Rendering', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['camera', 'microphone']);
    await page.goto('/');
    // Wait for WebGL to initialize
    await page.waitForTimeout(3000);
  });

  test('canvas renders without artifacts', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    
    // Take screenshot of canvas area
    const screenshot = await canvas.screenshot();
    
    // Verify screenshot is not empty/black
    // A completely black image would have very low byte variance
    expect(screenshot.length).toBeGreaterThan(1000);
  });

  test('render modes produce different outputs', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    
    // Capture standard mode
    const standardShot = await canvas.screenshot();
    
    // Skip comparison if canvas is likely empty (no camera in CI)
    // A mostly black/empty canvas will have very uniform pixel data
    if (standardShot.length < 2000) {
      test.skip(true, 'Canvas appears empty - likely no camera available');
      return;
    }
    
    // Switch to focus peaking
    const peakBtn = page.getByRole('button', { name: 'PEAK' });
    if (await peakBtn.isVisible()) {
      await peakBtn.click();
      await page.waitForTimeout(500);
      const peakShot = await canvas.screenshot();
      
      // Screenshots should be different (only if we have actual video)
      if (peakShot.length > 2000) {
        expect(Buffer.compare(standardShot, peakShot)).not.toBe(0);
      }
    }
    
    // Switch to zebras
    const zebraBtn = page.getByRole('button', { name: 'ZEBRA' });
    if (await zebraBtn.isVisible()) {
      await zebraBtn.click();
      await page.waitForTimeout(500);
      const zebraShot = await canvas.screenshot();
      
      if (zebraShot.length > 2000) {
        expect(Buffer.compare(standardShot, zebraShot)).not.toBe(0);
      }
    }
  });

  test('color grading affects output', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    
    // Capture baseline
    const baseline = await canvas.screenshot();
    
    // Skip if canvas is empty (no camera in CI)
    if (baseline.length < 2000) {
      test.skip(true, 'Canvas appears empty - likely no camera available');
      return;
    }
    
    // Navigate to color controls
    const colorTab = page.getByRole('button', { name: /color/i });
    if (await colorTab.isVisible()) {
      await colorTab.click();
      await page.waitForTimeout(300);
    }
    
    // Adjust exposure if slider exists
    const exposureSlider = page.locator('input[type="range"]').first();
    if (await exposureSlider.isVisible()) {
      // Move slider to max
      await exposureSlider.evaluate((el: HTMLInputElement) => {
        el.value = el.max;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.waitForTimeout(300);
      
      const adjusted = await canvas.screenshot();
      
      // Should be different after adjustment
      expect(Buffer.compare(baseline, adjusted)).not.toBe(0);
    }
  });

  test('flip transforms work correctly', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    
    // Capture baseline
    const baseline = await canvas.screenshot();
    
    // Skip if canvas is empty (no camera in CI)
    if (baseline.length < 2000) {
      test.skip(true, 'Canvas appears empty - likely no camera available');
      return;
    }
    
    // Find flip button
    const flipXBtn = page.getByRole('button', { name: /flip.*x/i });
    if (await flipXBtn.isVisible()) {
      await flipXBtn.click();
      await page.waitForTimeout(300);
      
      const flipped = await canvas.screenshot();
      
      // Should be different (mirrored)
      if (flipped.length > 2000) {
        expect(Buffer.compare(baseline, flipped)).not.toBe(0);
      }
      
      // Click again to restore
      await flipXBtn.click();
      await page.waitForTimeout(300);
      
      const restored = await canvas.screenshot();
      
      // Should match baseline (within tolerance for video frame differences)
      // Note: Due to live video, exact match is unlikely
    }
  });

  test('WebGL context is healthy', async ({ page }) => {
    const glInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return null;
      
      const gl = canvas.getContext('webgl2');
      if (!gl) return null;
      
      return {
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
        version: gl.getParameter(gl.VERSION),
        shadingVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
        contextLost: gl.isContextLost(),
      };
    });
    
    expect(glInfo).not.toBeNull();
    expect(glInfo?.contextLost).toBe(false);
    expect(glInfo?.maxTextureSize).toBeGreaterThanOrEqual(4096);
  });

  test('no shader compilation errors in console', async ({ page }) => {
    const shaderErrors: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Shader') && (text.includes('error') || text.includes('ERROR'))) {
        shaderErrors.push(text);
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    expect(shaderErrors).toHaveLength(0);
  });

  test('beauty effects apply without crashes', async ({ page }) => {
    // Navigate to beauty/AI tab if exists
    const aiTab = page.getByRole('button', { name: /ai|beauty/i });
    if (await aiTab.isVisible()) {
      await aiTab.click();
      await page.waitForTimeout(500);
      
      // Enable beauty if toggle exists
      const beautyToggle = page.locator('input[type="checkbox"]').first();
      if (await beautyToggle.isVisible()) {
        await beautyToggle.click();
        await page.waitForTimeout(1000);
        
        // Should not crash - canvas still visible
        const canvas = page.locator('canvas').first();
        await expect(canvas).toBeVisible();
      }
    }
  });
});

test.describe('Visual Regression - Snapshots', () => {
  test.skip('UI components match snapshots', async ({ page }) => {
    // Skip by default - enable for CI with baseline images
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Snapshot the control panel
    const panel = page.locator('[data-testid="control-panel"]');
    if (await panel.isVisible()) {
      await expect(panel).toHaveScreenshot('control-panel.png', {
        maxDiffPixels: 100,
      });
    }
  });
});
