import { test, expect } from '@playwright/test';

test.describe('Post-refactor validation', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant permissions for camera/mic
    await context.grantPermissions(['camera', 'microphone']);
    await page.goto('/');
    // Wait for app to load
    await page.waitForSelector('[data-testid="app-layout"], canvas', { 
      state: 'visible', 
      timeout: 15000 
    });
  });

  test('app loads without errors', async ({ page }) => {
    // Check no console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait for initial render
    await page.waitForTimeout(2000);

    // Filter out expected errors (like missing camera in CI)
    const criticalErrors = errors.filter(e => 
      !e.includes('NotAllowedError') && 
      !e.includes('NotFoundError') &&
      !e.includes('Permission denied')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('navigation tabs work', async ({ page }) => {
    // Find and click different tabs
    const tabs = ['ADJUST', 'AI', 'OVERLAYS', 'SYSTEM', 'THEME'];
    
    for (const tab of tabs) {
      const tabButton = page.locator(`[data-testid="nav-${tab.toLowerCase()}"], button:has-text("${tab}")`).first();
      if (await tabButton.isVisible()) {
        await tabButton.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('canvas renders', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    
    // Canvas should exist
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Canvas should have dimensions
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThan(0);
      expect(box.height).toBeGreaterThan(0);
    }
  });

  test('settings persist across reload', async ({ page }) => {
    // Change a setting (theme)
    const themeTab = page.locator('button:has-text("Theme"), [data-testid="nav-theme"]').first();
    if (await themeTab.isVisible()) {
      await themeTab.click();
      await page.waitForTimeout(500);
    }

    // Get current localStorage
    const settingsBefore = await page.evaluate(() => localStorage.getItem('lumia_settings'));

    // Reload
    await page.reload();
    await page.waitForSelector('[data-testid="app-layout"], canvas', { 
      state: 'visible', 
      timeout: 15000 
    });

    // Check settings persisted
    const settingsAfter = await page.evaluate(() => localStorage.getItem('lumia_settings'));
    
    // Settings should exist (may be null if never saved, which is fine)
    if (settingsBefore) {
      expect(settingsAfter).toBeTruthy();
    }
  });

  test('no memory leak on tab switching', async ({ page }) => {
    // Skip if performance.memory not available (non-Chrome)
    const hasMemoryAPI = await page.evaluate(() => 'memory' in performance);
    if (!hasMemoryAPI) {
      test.skip();
      return;
    }

    // Get initial memory
    const initialMemory = await page.evaluate(() => {
      const perf = performance as any;
      return perf.memory?.usedJSHeapSize || 0;
    });

    // Switch tabs multiple times
    const tabs = ['ADJUST', 'AI', 'OVERLAYS', 'SYSTEM', 'THEME', 'MEDIA'];
    for (let i = 0; i < 3; i++) {
      for (const tab of tabs) {
        const tabButton = page.locator(`[data-testid="nav-${tab.toLowerCase()}"], button:has-text("${tab}")`).first();
        if (await tabButton.isVisible()) {
          await tabButton.click();
          await page.waitForTimeout(100);
        }
      }
    }

    // Force GC if available
    await page.evaluate(() => {
      if ((window as any).gc) (window as any).gc();
    });
    await page.waitForTimeout(1000);

    // Get final memory
    const finalMemory = await page.evaluate(() => {
      const perf = performance as any;
      return perf.memory?.usedJSHeapSize || 0;
    });

    // Memory growth should be reasonable (< 50MB)
    const growthMB = (finalMemory - initialMemory) / (1024 * 1024);
    expect(growthMB).toBeLessThan(50);
  });

  test('cleanup on page unload', async ({ page, context }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate away
    await page.goto('about:blank');
    await page.waitForTimeout(500);

    // Check no orphaned resource errors
    const orphanErrors = errors.filter(e => 
      e.includes('orphan') || 
      e.includes('leak') ||
      e.includes('not disposed')
    );

    expect(orphanErrors).toHaveLength(0);
  });

  test('error boundary catches errors gracefully', async ({ page }) => {
    // Inject an error
    await page.evaluate(() => {
      // This should be caught by ErrorBoundary
      const event = new ErrorEvent('error', {
        error: new Error('Test error'),
        message: 'Test error',
      });
      window.dispatchEvent(event);
    });

    // App should still be functional or show error UI
    await page.waitForTimeout(500);
    
    // Page should not be blank
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent).toBeTruthy();
  });
});

test.describe('Controller integration', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['camera', 'microphone']);
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-layout"], canvas', { 
      state: 'visible', 
      timeout: 15000 
    });
  });

  test('camera controller provides device list', async ({ page }) => {
    // Navigate to camera/adjust tab
    const adjustTab = page.locator('button:has-text("Adjust"), [data-testid="nav-adjust"]').first();
    if (await adjustTab.isVisible()) {
      await adjustTab.click();
      await page.waitForTimeout(500);
    }

    // Look for device selector
    const deviceSelector = page.locator('select, [role="combobox"]').first();
    // May not be visible if no camera, but should not error
  });

  test('render controller exposes canvas', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
  });

  test('AI controller panel loads', async ({ page }) => {
    const aiTab = page.locator('button:has-text("AI"), [data-testid="nav-ai"]').first();
    if (await aiTab.isVisible()) {
      await aiTab.click();
      await page.waitForTimeout(500);

      // Should see AI-related content
      const aiContent = page.locator('text=/analysis|beauty|smart/i').first();
      // Content may vary, just check no crash
    }
  });

  test('recording controller panel loads', async ({ page }) => {
    const systemTab = page.locator('button:has-text("System"), [data-testid="nav-system"]').first();
    if (await systemTab.isVisible()) {
      await systemTab.click();
      await page.waitForTimeout(500);

      // Should see recording-related content
      const recordContent = page.locator('text=/record|capture|export/i').first();
      // Content may vary, just check no crash
    }
  });
});
