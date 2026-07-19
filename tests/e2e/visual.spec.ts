import { test, expect, Page } from '@playwright/test';

// Helper to login as waiter
async function loginAsWaiter(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: /گارسون/i }).click();
  await page.waitForTimeout(500);
  await expect(page.getByRole('dialog')).not.toBeVisible();
}

test.describe('Visual Regression Tests', () => {
  test.describe('Login Modal', () => {
    test('login modal should be visible', async ({ page }) => {
      await page.goto('/');
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
    });
  });

  test.describe('3D Scene', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsWaiter(page);
    });

    test('3D canvas should render', async ({ page }) => {
      // Wait for canvas to load
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible({ timeout: 10000 });
    });

    test('tables should be visible in 3D scene', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible({ timeout: 10000 });
      
      // Canvas should have dimensions
      const box = await canvas.boundingBox();
      expect(box?.width).toBeGreaterThan(100);
      expect(box?.height).toBeGreaterThan(100);
    });
  });

  test.describe('Status Bar', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsWaiter(page);
    });

    test('status bar should be visible', async ({ page }) => {
      // Status bar should show status counts
      await expect(page.getByText(/خالی/i)).toBeVisible();
      await expect(page.getByText(/اشغال/i)).toBeVisible();
    });
  });

  test.describe('Header', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsWaiter(page);
    });

    test('header should be visible after login', async ({ page }) => {
      const header = page.locator('header').first();
      await expect(header).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should render on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Login should work
      await page.getByRole('button', { name: /گارسون/i }).click();
      await page.waitForTimeout(500);
      
      // UI should be visible
      await expect(page.locator('header')).toBeVisible();
    });

    test('should render on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      
      await page.getByRole('button', { name: /گارسون/i }).click();
      await page.waitForTimeout(500);
      await expect(page.locator('header')).toBeVisible();
    });

    test('should render on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/');
      
      await page.getByRole('button', { name: /گارسون/i }).click();
      await page.waitForTimeout(500);
      await expect(page.locator('header')).toBeVisible();
    });
  });
});
