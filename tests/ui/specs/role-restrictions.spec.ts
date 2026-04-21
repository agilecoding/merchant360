import { test, expect, STORAGE } from '../fixtures/index';

test.describe('Admin-only routes', () => {
  test('admin can access /admin page', async ({ page, dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.navigateTo('admin');
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByRole('heading', { name: /admin/i })).toBeVisible();
  });

  test.describe('analyst cannot access /admin', () => {
    test.use({ storageState: STORAGE.analyst });

    test('redirected from /admin', async ({ page }) => {
      await page.goto('/admin');
      await expect(page).not.toHaveURL(/\/admin/);
    });

    test('/admin nav link not shown in sidebar', async ({ page, dashboardPage }) => {
      await dashboardPage.goto();
      await expect(page.getByRole('link', { name: /^admin$/i })).not.toBeVisible();
    });
  });

  test.describe('merchant cannot access /admin', () => {
    test.use({ storageState: STORAGE.merchant });

    test('redirected from /admin', async ({ page }) => {
      await page.goto('/admin');
      await expect(page).not.toHaveURL(/\/admin/);
    });
  });
});

test.describe('Merchant scoping', () => {
  test.use({ storageState: STORAGE.merchant });

  test('merchant sees transactions page', async ({ transactionsPage }) => {
    await transactionsPage.goto();
    await transactionsPage.expectLoaded();
  });

  test('merchant does not see merchants nav link', async ({ page, dashboardPage }) => {
    await dashboardPage.goto();
    await expect(page.getByRole('link', { name: /^merchants$/i })).not.toBeVisible();
  });
});
