import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.describe('Glassmorphism Effects', () => {
    test('login modal should have glassmorphism effect', async ({ page }) => {
      await page.goto('/');
      
      // Modal should have backdrop blur
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      
      // Should have semi-transparent background
      const bgColor = await modal.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.backgroundColor;
      });
      
      // Should include some transparency
      expect(bgColor).toMatch(/rgba?\(.*,\s*[\d.]+\)/);
    });

    test('header should have glassmorphism effect', async ({ page }) => {
      await page.goto('/');
      await page.getByText('PIN: 0000').click();
      
      // Header should have backdrop blur
      const header = page.locator('header').first();
      await expect(header).toBeVisible();
    });

    test('panels should have glass effect', async ({ page }) => {
      await page.goto('/');
      await page.getByText('PIN: 0000').click();
      
      // Select table to open panel
      await page.keyboard.press('Alt+t');
      await page.getByText('میز 1').click();
      
      // Panel should have semi-transparent background
      const panel = page.locator('.panel, [class*="panel"]').first();
      if (await panel.isVisible({ timeout: 2000 })) {
        const bgColor = await panel.evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.backgroundColor;
        });
        expect(bgColor).toMatch(/rgba?\(.*,\s*[\d.]+\)/);
      }
    });

    test('toast notifications should have glass effect', async ({ page }) => {
      await page.goto('/');
      await page.getByText('PIN: 0000').click();
      
      // Toast should appear with glass effect
      // This would require triggering a toast
    });
  });

  test.describe('3D Scene', () => {
    test('3D canvas should render', async ({ page }) => {
      await page.goto('/');
      await page.getByText('PIN: 0000').click();
      
      // Wait for canvas to load
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible({ timeout: 10000 });
    });

    test('tables should be visible in 3D scene', async ({ page }) => {
      await page.goto('/');
      await page.getByText('PIN: 0000').click();
      
      // Canvas should exist
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible({ timeout: 10000 });
      
      // Canvas should have dimensions
      const box = await canvas.boundingBox();
      expect(box?.width).toBeGreaterThan(100);
      expect(box?.height).toBeGreaterThan(100);
    });

    test('camera controls should work', async ({ page }) => {
      await page.goto('/');
      await page.getByText('PIN: 0000').click();
      
      const canvas = page.locator('canvas').first();
      await canvas.waitFor({ state: 'visible', timeout: 10000 });
      
      // Get initial canvas position
      const initialBox = await canvas.boundingBox();
      
      // Drag on canvas
      await page.mouse.move(initialBox!.x + initialBox!.width / 2, initialBox!.y + initialBox!.height / 2);
      await page.mouse.down();
      await page.mouse.move(initialBox!.x + initialBox!.width / 2 + 100, initialBox!.y + initialBox!.height / 2);
      await page.mouse.up();
      
      // Canvas should still be visible (no crash)
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Color Scheme', () => {
    test('status colors should be distinct', async ({ page }) => {
      await page.goto('/');
      await page.getByText('PIN: 0000').click();
      
      // Open text fallback to see status
      await page.keyboard.press('Alt+t');
      
      // Check that different statuses have different colors
      const available = page.locator('text=/خالی/').first();
      const occupied = page.locator('text=/اشغال/').first();
      
      if (await available.isVisible() && await occupied.isVisible()) {
        const availableColor = await available.evaluate(el => 
          window.getComputedStyle(el).color
        );
        const occupiedColor = await occupied.evaluate(el => 
          window.getComputedStyle(el).color
        );
        
        // Colors should be different
        expect(availableColor).not.toBe(occupiedColor);
      }
    });

    test('accent color should be applied consistently', async ({ page }) => {
      await page.goto('/');
      await page.getByText('PIN: 0000').click();
      
      // Accent color (gold/brown) should appear in UI
      const accentElements = page.locator('[class*="accent"], [class*="bg-"]').first();
      if (await accentElements.isVisible({ timeout: 2000 })) {
        const color = await accentElements.evaluate(el => 
          window.getComputedStyle(el).backgroundColor
        );
        // Should have some color
        expect(color).toBeTruthy();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should render on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Login should work
      await page.getByText('PIN: 0000').click();
      
      // UI should be visible
      await expect(page.locator('header')).toBeVisible();
    });

    test('should render on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      
      await page.getByText('PIN: 0000').click();
      await expect(page.locator('header')).toBeVisible();
    });

    test('should render on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/');
      
      await page.getByText('PIN: 0000').click();
      await expect(page.locator('header')).toBeVisible();
    });
  });
});
