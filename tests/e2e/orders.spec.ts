import { test, expect, Page } from '@playwright/test';

// Helper to login as waiter using the quick login button
async function loginAsWaiter(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('dialog')).toBeVisible();
  // Click the waiter quick login button
  await page.getByRole('button', { name: /گارسون/i }).click();
  await page.waitForTimeout(500);
  await expect(page.getByRole('dialog')).not.toBeVisible();
}

// Helper to select a table (using text fallback mode)
async function selectTable(page: Page, tableNumber: number) {
  // First toggle to text mode
  await page.keyboard.press('Alt+t');
  await page.waitForTimeout(300);
  
  // Click on table text
  await page.getByText(`میز ${tableNumber}`).click();
  await page.waitForTimeout(300);
}

test.describe('Order Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsWaiter(page);
  });

  test.describe('Table Selection', () => {
    test('should select table 1', async ({ page }) => {
      await selectTable(page, 1);
      await expect(page.getByText('میز 1')).toBeVisible();
    });

    test('should show table panel when table selected', async ({ page }) => {
      await selectTable(page, 1);
      // Table panel should show with status buttons
      await expect(page.getByText(/وضعیت/i)).toBeVisible({ timeout: 2000 });
    });
  });

  test.describe('Menu Interaction', () => {
    test('should open menu modal when clicking menu button', async ({ page }) => {
      await selectTable(page, 1);
      
      // Click menu button
      await page.getByRole('button', { name: /منو/i }).click();
      await page.waitForTimeout(500);
      
      // Menu modal should open
      await expect(page.getByRole('heading', { name: /منوی کافه/i })).toBeVisible();
    });

    test('should filter menu items by category', async ({ page }) => {
      // Select table first
      await selectTable(page, 1);
      
      // Open menu
      await page.getByRole('button', { name: /منو/i }).click();
      await page.waitForSelector('#menuModalTitle');
      
      // Should see category buttons
      await expect(page.getByText(/نوشیدنی/i)).toBeVisible();
    });

    test('should close menu modal', async ({ page }) => {
      await selectTable(page, 1);
      await page.getByRole('button', { name: /منو/i }).click();
      await page.waitForSelector('#menuModalTitle');
      
      // Close modal by pressing Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      
      // Modal should be closed
      await expect(page.getByRole('heading', { name: /منوی کافه/i })).not.toBeVisible();
    });
  });

  test.describe('Order Status Changes', () => {
    test('should change table status to occupied', async ({ page }) => {
      await selectTable(page, 1);
      
      // Click occupied status button
      const occupiedBtn = page.getByRole('button', { name: /اشغال/i });
      await occupiedBtn.click();
      
      // The button should now be highlighted
      await expect(occupiedBtn).toHaveClass(/accent|bg-/);
    });

    test('should change table status to available', async ({ page }) => {
      await selectTable(page, 2);
      
      // First set to occupied
      await page.getByRole('button', { name: /اشغال/i }).click();
      
      // Then set back to available
      await page.getByRole('button', { name: /خالی/i }).click();
      await expect(page.getByRole('button', { name: /خالی/i })).toHaveClass(/accent|bg-/);
    });

    test('should change table status to preparing', async ({ page }) => {
      await selectTable(page, 3);
      
      const preparingBtn = page.getByRole('button', { name: /آماده‌سازی/i });
      await preparingBtn.click();
      await expect(preparingBtn).toHaveClass(/accent|bg-/);
    });

    test('should change table status to reserved', async ({ page }) => {
      await selectTable(page, 4);
      
      const reservedBtn = page.getByRole('button', { name: /رزرو/i });
      await reservedBtn.click();
      await expect(reservedBtn).toHaveClass(/accent|bg-/);
    });

    test('should change table status to cleaning', async ({ page }) => {
      await selectTable(page, 5);
      
      const cleaningBtn = page.getByRole('button', { name: /تمیزکاری/i });
      await cleaningBtn.click();
      await expect(cleaningBtn).toHaveClass(/accent|bg-/);
    });
  });

  test.describe('Status Bar Updates', () => {
    test('should show status counts in status bar', async ({ page }) => {
      // Login should show status bar
      await expect(page.getByText(/خالی/i)).toBeVisible();
      await expect(page.getByText(/اشغال/i)).toBeVisible();
    });
  });
});
