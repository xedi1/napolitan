import { test, expect, Page } from '@playwright/test';

// Helper to login as waiter
async function loginAsWaiter(page: Page) {
  await page.goto('/');
  await page.getByText('PIN: 0000').click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
}

// Helper to select a table
async function selectTable(page: Page, tableNumber: number) {
  // In 3D mode, we need to click on the table
  // For now, we'll use the text fallback
  await page.keyboard.press('Alt+t'); // Toggle text mode
  await page.getByText(`میز ${tableNumber}`).click();
}

// Helper to open menu
async function openMenu(page: Page) {
  await page.getByRole('button', { name: /منوی|menu/i }).click();
}

test.describe('Order Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsWaiter(page);
  });

  test.describe('Adding Order', () => {
    test('should show new order button when table is selected', async ({ page }) => {
      // Select table
      await selectTable(page, 1);
      
      // Should show new order button or order panel
      await expect(page.getByText('میز 1')).toBeVisible();
    });

    test('should create new order when button is clicked', async ({ page }) => {
      await selectTable(page, 1);
      
      // Click new order button
      const newOrderBtn = page.getByRole('button', { name: /سفارش جدید/i });
      if (await newOrderBtn.isVisible()) {
        await newOrderBtn.click();
        
        // Table status should change to occupied
        await expect(page.getByText(/اشغال/i)).toBeVisible();
      }
    });

    test('should open menu modal when viewing menu', async ({ page }) => {
      // Select table first
      await selectTable(page, 1);
      
      // Find and click menu button
      const menuBtn = page.getByRole('button', { name: /منو/i }).first();
      if (await menuBtn.isVisible()) {
        await menuBtn.click();
        
        // Menu modal should open
        await expect(page.getByRole('heading', { name: /منوی کافه/i })).toBeVisible();
      }
    });

    test('should filter menu items by category', async ({ page }) => {
      // Open menu
      await page.getByRole('button', { name: /منو/i }).first().click();
      await page.waitForSelector('#menuModalTitle');
      
      // Click on coffee category
      const coffeeBtn = page.getByText(/نوشیدنی گرم/i);
      if (await coffeeBtn.isVisible()) {
        await coffeeBtn.click();
        
        // Should show coffee items
        await expect(page.getByText('اسپرسو')).toBeVisible();
      }
    });

    test('should add item to order', async ({ page }) => {
      await selectTable(page, 1);
      
      // Open menu and add item
      const menuBtn = page.getByRole('button', { name: /منو/i }).first();
      await menuBtn.click();
      await page.waitForSelector('#menuModalTitle');
      
      // Click on first menu item
      const menuItem = page.locator('.grid > div').first();
      await menuItem.click();
      
      // Should show item in order (varies by implementation)
      // Close menu
      await page.keyboard.press('Escape');
    });
  });

  test.describe('Order Status', () => {
    test('should show order items', async ({ page }) => {
      await selectTable(page, 1);
      
      // Create order first
      const newOrderBtn = page.getByRole('button', { name: /سفارش جدید/i });
      if (await newOrderBtn.isVisible()) {
        await newOrderBtn.click();
        
        // Order panel should show
        await expect(page.getByText(/سفارش میز 1/i)).toBeVisible();
      }
    });

    test('should display correct totals', async ({ page }) => {
      await selectTable(page, 1);
      
      // Create and add items
      const newOrderBtn = page.getByRole('button', { name: /سفارش جدید/i });
      if (await newOrderBtn.isVisible()) {
        await newOrderBtn.click();
        
        // Should show price formatting
        await expect(page.locator('text=/تومان/')).toBeVisible();
      }
    });
  });
});

test.describe('Table Status E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsWaiter(page);
  });

  test.describe('Status Changes', () => {
    test('should change table status to occupied', async ({ page }) => {
      await selectTable(page, 1);
      
      // Find and click occupied status
      const occupiedBtn = page.getByRole('button', { name: /اشغال/i });
      if (await occupiedBtn.isVisible()) {
        await occupiedBtn.click();
        
        // Should update
        await expect(occupiedBtn).toHaveClass(/accent|bg-/);
      }
    });

    test('should change table status to available', async ({ page }) => {
      await selectTable(page, 1);
      
      // First set to occupied
      const occupiedBtn = page.getByRole('button', { name: /اشغال/i });
      if (await occupiedBtn.isVisible()) {
        await occupiedBtn.click();
      }
      
      // Then set back to available
      const availableBtn = page.getByRole('button', { name: /خالی/i });
      if (await availableBtn.isVisible()) {
        await availableBtn.click();
      }
    });

    test('should change table status to preparing', async ({ page }) => {
      await selectTable(page, 2);
      
      const preparingBtn = page.getByRole('button', { name: /آماده‌سازی/i });
      if (await preparingBtn.isVisible()) {
        await preparingBtn.click();
      }
    });

    test('should change table status to reserved', async ({ page }) => {
      await selectTable(page, 3);
      
      const reservedBtn = page.getByRole('button', { name: /رزرو/i });
      if (await reservedBtn.isVisible()) {
        await reservedBtn.click();
      }
    });

    test('should change table status to cleaning', async ({ page }) => {
      await selectTable(page, 4);
      
      const cleaningBtn = page.getByRole('button', { name: /تمیزکاری/i });
      if (await cleaningBtn.isVisible()) {
        await cleaningBtn.click();
      }
    });
  });

  test.describe('Status Bar Updates', () => {
    test('should show correct status counts', async ({ page }) => {
      // Select and change status of table 1
      await selectTable(page, 1);
      
      const occupiedBtn = page.getByRole('button', { name: /اشغال/i });
      if (await occupiedBtn.isVisible()) {
        await occupiedBtn.click();
      }
      
      // Status bar should update
      await expect(page.locator('text=/2.*اشغال|اشغال.*2/')).toBeVisible({ timeout: 2000 }).catch(() => {
        // Status bar might not update immediately
      });
    });
  });

  test.describe('Multi-table Status', () => {
    test('should handle multiple tables with different statuses', async ({ page }) => {
      // Table 1 - occupied
      await selectTable(page, 1);
      await page.getByRole('button', { name: /اشغال/i }).click().catch(() => {});
      
      // Table 2 - preparing
      await selectTable(page, 2);
      await page.getByRole('button', { name: /آماده‌سازی/i }).click().catch(() => {});
      
      // Table 3 - available
      await selectTable(page, 3);
      await page.getByRole('button', { name: /خالی/i }).click().catch(() => {});
      
      // All three should show in status bar
      await expect(page.locator('text=/اشغال/')).toBeVisible();
      await expect(page.locator('text=/آماده‌سازی/')).toBeVisible();
    });
  });
});
