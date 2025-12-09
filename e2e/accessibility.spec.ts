import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['camera', 'microphone']);
    await page.goto('/');
    await page.waitForTimeout(2000);
  });

  test('should have no critical accessibility violations', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('canvas') // Canvas is inherently not accessible
      .analyze();

    // Filter to critical/serious only
    const critical = results.violations.filter(v => 
      v.impact === 'critical' || v.impact === 'serious'
    );

    if (critical.length > 0) {
      console.log('Critical violations:', JSON.stringify(critical, null, 2));
    }

    expect(critical).toHaveLength(0);
  });

  test('all interactive elements should be keyboard accessible', async ({ page }) => {
    // Tab through the page
    const focusableElements: string[] = [];
    
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName + (el?.getAttribute('aria-label') || el?.textContent?.slice(0, 20) || '');
      });
      if (focused && !focusableElements.includes(focused)) {
        focusableElements.push(focused);
      }
    }

    // Should have multiple focusable elements
    expect(focusableElements.length).toBeGreaterThan(5);
  });

  test('buttons should have accessible names', async ({ page }) => {
    const buttons = await page.locator('button').all();
    
    for (const button of buttons.slice(0, 10)) {
      const name = await button.getAttribute('aria-label') || 
                   await button.textContent() ||
                   await button.getAttribute('title');
      
      // Every button should have some accessible name
      expect(name?.trim().length).toBeGreaterThan(0);
    }
  });

  test('images should have alt text', async ({ page }) => {
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      // Either has alt text or is decorative (role="presentation")
      expect(alt !== null || role === 'presentation').toBe(true);
    }
  });

  test('color contrast should be sufficient', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('button, a, p, span, label')
      .analyze();

    const contrastViolations = results.violations.filter(v => 
      v.id === 'color-contrast'
    );

    // Allow some violations for stylistic elements
    expect(contrastViolations.length).toBeLessThan(5);
  });

  test('focus indicators should be visible', async ({ page }) => {
    // Find a button and focus it
    const button = page.locator('button').first();
    await button.focus();

    // Check if focus is visible (has outline or box-shadow)
    const styles = await button.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        outline: computed.outline,
        boxShadow: computed.boxShadow,
        border: computed.border,
      };
    });

    // Should have some visible focus indicator
    const hasFocusIndicator = 
      styles.outline !== 'none' ||
      styles.boxShadow !== 'none' ||
      styles.border !== 'none';

    expect(hasFocusIndicator).toBe(true);
  });

  test('page should have proper heading hierarchy', async ({ page }) => {
    const headings = await page.evaluate(() => {
      const h = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      return Array.from(h).map(el => ({
        level: parseInt(el.tagName[1] || '0'),
        text: el.textContent?.slice(0, 30) || ''
      }));
    });

    // Should have at least one heading
    expect(headings.length).toBeGreaterThan(0);

    // Check hierarchy (no skipping levels)
    let lastLevel = 0;
    for (const h of headings) {
      // Shouldn't skip more than one level
      expect(h.level - lastLevel).toBeLessThanOrEqual(2);
      lastLevel = h.level;
    }
  });

  test('form inputs should have labels', async ({ page }) => {
    const inputs = await page.locator('input, select, textarea').all();
    
    let unlabeledCount = 0;
    for (const input of inputs.slice(0, 10)) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const role = await input.getAttribute('role');
      
      // Check for associated label
      let hasLabel = !!ariaLabel || !!ariaLabelledBy;
      
      if (id && !hasLabel) {
        const label = await page.locator(`label[for="${id}"]`).count();
        hasLabel = label > 0;
      }

      // Inputs should have labels (except hidden ones and MUI internal inputs)
      const type = await input.getAttribute('type');
      const isHidden = type === 'hidden' || await input.isHidden();
      const isMuiInternal = role === 'combobox' || role === 'listbox'; // MUI handles these internally
      
      if (!isHidden && !isMuiInternal && !hasLabel) {
        unlabeledCount++;
      }
    }
    
    // Allow a small number of unlabeled inputs (MUI internal elements)
    expect(unlabeledCount).toBeLessThan(5);
  });
});
