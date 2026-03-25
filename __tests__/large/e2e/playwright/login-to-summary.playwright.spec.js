const { test, expect } = require('@playwright/test');

test('admin/admin でログイン成功後に summary へ遷移する', async ({ page }) => {
  await page.goto('/screen/login');

  await page.fill('#username', 'admin');
  await page.fill('#password', 'admin');

  await Promise.all([
    page.waitForResponse(response => response.url().endsWith('/api/login') && response.request().method() === 'POST'),
    page.getByRole('button', { name: 'ログイン' }).click(),
  ]);

  await expect(page).toHaveURL(/\/screen\/summary$/);
});
