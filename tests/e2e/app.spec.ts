import { test, expect } from '@playwright/test';

test.describe('Cafe Napoli', () => {
  test('should load the login page', async ({ page }) => {
    await page.goto('/');
    
    // Check for login modal
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Cafe Napoli')).toBeVisible();
    await expect(page.getByText('برای دسترسی PIN وارد کنید')).toBeVisible();
  });

  test('should login with valid PIN', async ({ page }) => {
    await page.goto('/');
    
    // Click on waiter PIN hint
    await page.getByText('PIN: 0000').click();
    
    // Should close login modal
    await expect(page.getByRole('dialog')).not.toBeVisible();
    
    // Should show user badge
    await expect(page.getByText('رضا کریمی')).toBeVisible();
  });

  test('should show error for invalid PIN', async ({ page }) => {
    await page.goto('/');
    
    // Enter wrong PIN
    await page.getByRole('button', { name: '1' }).click();
    await page.getByRole('button', { name: '2' }).click();
    await page.getByRole('button', { name: '3' }).click();
    await page.getByRole('button', { name: '9' }).click();
    
    // Should show error
    await expect(page.getByText('PIN نامعتبر است')).toBeVisible();
  });

  test('should toggle text mode with Alt+T', async ({ page }) => {
    await page.goto('/');
    
    // Login first
    await page.getByText('PIN: 0000').click();
    
    // Press Alt+T
    await page.keyboard.press('Alt+t');
    
    // Should show text fallback
    await expect(page.getByText('نمای جدول‌ها')).toBeVisible();
  });
});
