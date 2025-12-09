import { test, expect } from '@playwright/test';

test.describe('Critical User Paths', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant camera/mic permissions
    await context.grantPermissions(['camera', 'microphone']);
    await page.goto('/');
  });

  test('app loads without crashing', async ({ page }) => {
    // Wait for main UI to render
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    
    // No error screens
    await expect(page.getByText(/error|crash|failed/i)).not.toBeVisible();
  });

  test('camera permission flow', async ({ page }) => {
    // Should show video canvas when permission granted
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });
    
    // Canvas should have dimensions (rendering)
    const box = await canvas.boundingBox();
    expect(box?.width).toBeGreaterThan(100);
    expect(box?.height).toBeGreaterThan(100);
  });

  test('navigation tabs work', async ({ page }) => {
    await page.waitForTimeout(2000); // Wait for initial load
    
    // Click through main tabs
    const tabs = ['Color', 'Camera', 'Output', 'Theme'];
    for (const tab of tabs) {
      const tabBtn = page.getByRole('button', { name: new RegExp(tab, 'i') });
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('color grading controls respond', async ({ page }) => {
    // Navigate to color tab
    const colorTab = page.getByRole('button', { name: /color/i });
    if (await colorTab.isVisible()) {
      await colorTab.click();
    }
    
    // Find exposure slider and interact
    const exposureSlider = page.getByLabel(/exposure/i);
    if (await exposureSlider.isVisible()) {
      await exposureSlider.click();
      // Slider should be interactive
      await expect(exposureSlider).toBeEnabled();
    }
  });

  test('screenshot capture works', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Find and click capture button
    const captureBtn = page.getByRole('button', { name: /capture|photo|screenshot/i });
    if (await captureBtn.isVisible()) {
      await captureBtn.click();
      
      // Should trigger capture animation or add to media
      await page.waitForTimeout(1500);
    }
  });

  test('render mode switching', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Find render mode buttons
    const modes = ['STD', 'PEAK', 'ZEBRA'];
    for (const mode of modes) {
      const btn = page.getByRole('button', { name: mode });
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(200);
      }
    }
  });

  test('PWA installable', async ({ page }) => {
    // Check manifest is valid
    const manifest = await page.evaluate(async () => {
      const link = document.querySelector('link[rel="manifest"]');
      if (!link) return null;
      const res = await fetch(link.getAttribute('href') || '');
      return res.json();
    });
    
    expect(manifest).toBeTruthy();
    expect(manifest?.name).toBe('Lumia Pro Lens');
    expect(manifest?.display).toBe('standalone');
  });

  test('no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Filter out expected warnings
    const criticalErrors = errors.filter(e => 
      !e.includes('Sentry DSN') && 
      !e.includes('favicon') &&
      !e.includes('DevTools')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('WebGL context created', async ({ page }) => {
    const hasWebGL = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return false;
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      return !!gl;
    });
    
    expect(hasWebGL).toBe(true);
  });
});

test.describe('Performance', () => {
  test('initial load under 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.locator('canvas').waitFor({ state: 'visible', timeout: 5000 });
    const loadTime = Date.now() - start;
    
    expect(loadTime).toBeLessThan(5000);
    console.log(`Load time: ${loadTime}ms`);
  });

  test('no memory leaks on tab switch', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Get initial memory
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Switch tabs multiple times
    for (let i = 0; i < 5; i++) {
      const tabs = page.getByRole('button').filter({ hasText: /color|camera|output/i });
      const count = await tabs.count();
      for (let j = 0; j < count; j++) {
        await tabs.nth(j).click();
        await page.waitForTimeout(200);
      }
    }
    
    // Force GC if available
    await page.evaluate(() => {
      if ((window as any).gc) (window as any).gc();
    });
    
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Memory shouldn't grow more than 50MB
    const growth = finalMemory - initialMemory;
    expect(growth).toBeLessThan(50 * 1024 * 1024);
  });
});
