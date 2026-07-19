import { test, expect, Page } from '@playwright/test';

// Helper to login as waiter using the quick login button
async function loginAsWaiter(page: Page) {
  await page.goto('/');
  
  // Wait for login modal to appear
  await expect(page.getByRole('dialog')).toBeVisible();
  
  // Click the waiter quick login button (gnapoli)
  await page.getByRole('button', { name: /گارسون|gnapoli/i }).click();
  
  // Wait a bit for login to process
  await page.waitForTimeout(500);
  
  // Modal should be hidden
  await expect(page.getByRole('dialog')).not.toBeVisible();
}

// Helper to login as manager
async function loginAsManager(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: /مدیریت|gmodiriat/i }).click();
  await page.waitForTimeout(500);
  await expect(page.getByRole('dialog')).not.toBeVisible();
}

test.describe('Cafe Napoli Login', () => {
  test('should show login modal on page load', async ({ page }) => {
    await page.goto('/');
    
    // Check for login modal
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Napolitian')).toBeVisible();
    await expect(page.getByText('سیستم مدیریت کافه')).toBeVisible();
  });

  test('should login as waiter using quick login button', async ({ page }) => {
    await page.goto('/');
    
    // Click waiter quick login button
    await page.getByRole('button', { name: /گارسون/i }).click();
    
    // Should close login modal
    await page.waitForTimeout(500);
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should login with username and password', async ({ page }) => {
    await page.goto('/');
    
    // Fill in credentials
    await page.getByLabel(/نام کاربری/i).fill('gnapoli');
    await page.getByLabel(/رمز عبور/i).fill('1saeid');
    
    // Submit
    await page.getByRole('button', { name: /ورود به سیستم/i }).click();
    
    // Modal should close
    await page.waitForTimeout(500);
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/');
    
    // Enter wrong credentials
    await page.getByLabel(/نام کاربری/i).fill('wronguser');
    await page.getByLabel(/رمز عبور/i).fill('wrongpass');
    
    // Submit
    await page.getByRole('button', { name: /ورود به سییستم/i }).click();
    
    // Should show error
    await expect(page.getByText(/نام کاربری یا رمز عبور اشتباه/i)).toBeVisible();
  });

  test('should toggle text mode with Alt+T', async ({ page }) => {
    await page.goto('/');
    
    // Login first
    await page.getByRole('button', { name: /گارسون/i }).click();
    await page.waitForTimeout(500);
    
    // Press Alt+T
    await page.keyboard.press('Alt+t');
    
    // Should show text fallback
    await expect(page.getByText('نمای جدول‌ها')).toBeVisible();
  });
});
