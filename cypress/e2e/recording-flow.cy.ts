import { test, expect } from '@playwright/test';

test.describe('Recording Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    // Wait for the app to be ready, assuming an element with data-testid="app-ready" indicates readiness
    await page.waitForSelector('[data-testid="app-ready"]');
    // Grant camera permission for tests that need it
    await page.context().grantPermissions(['camera']);
  });

  test('can start and stop video recording', async ({ page }) => {
    // Assuming there's a record button
    await page.click('[aria-label="Start Recording"]');

    // Wait 2 seconds
    await page.waitForTimeout(2000);

    // Assuming there's a stop button
    await page.click('[aria-label="Stop Recording"]');

    // Open media library (assuming there's a button to open it)
    await page.click('[aria-label="Open Media Library"]');

    // Verify media library has new item (assuming first item is the newest)
    await expect(page.locator('[data-testid="media-library-item"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="media-library-item"] video').first()).toBeVisible();
  });

  test('can take a photo', async ({ page }) => {
    // Assuming there's a photo button
    await page.click('[aria-label="Take Photo"]');

    // Open media library
    await page.click('[aria-label="Open Media Library"]');

    // Verify media library has new photo
    await expect(page.locator('[data-testid="media-library-item"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="media-library-item"] img').first()).toBeVisible();
  });

  test('can delete media item', async ({ page }) => {
    // Take a photo first
    await page.click('[aria-label="Take Photo"]');
    
    // Open media library
    await page.click('[aria-label="Open Media Library"]');

    // Get the count of items before deletion
    const initialItemCount = await page.locator('[data-testid="media-library-item"]').count();

    // Click delete button for the first item
    await page.locator('[data-testid="media-library-item"] [aria-label="Delete media"]').first().click();
    
    // Confirm deletion
    await page.click('button:has-text("Delete")'); // Assuming a confirmation dialog with a "Delete" button

    // Verify it's gone
    await expect(page.locator('[data-testid="media-library-item"]')).toHaveCount(initialItemCount - 1);
  });

  test('handles camera permission denied', async ({ page, context }) => {
    // Deny camera permission specifically for this test
    await context.clearPermissions(); // Clear previously granted permissions
    await context.addPermissions(['microphone']); // Grant microphone if needed, but not camera
    // Or simpler: just deny camera from the start, but then other tests would fail

    // Reload page to trigger permission request
    await page.reload();

    // Verify error message shown (assuming a specific error message appears)
    await expect(page.getByText('Camera access denied. Please enable camera in browser settings.')).toBeVisible();
  });
});
