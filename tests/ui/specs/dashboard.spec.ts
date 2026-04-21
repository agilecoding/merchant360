import { test, expect } from '../fixtures/index';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.expectLoaded();
  });

  test('shows page heading', async ({ dashboardPage }) => {
    await expect(dashboardPage.heading).toBeVisible();
  });

  test('sidebar navigation links are visible', async ({ page }) => {
    for (const label of ['Dashboard', 'Transactions', 'Refunds']) {
      await expect(page.getByRole('link', { name: new RegExp(`^${label}$`, 'i') })).toBeVisible();
    }
  });

  test('navigates to transactions via sidebar', async ({ dashboardPage, page }) => {
    await dashboardPage.navigateTo('transactions');
    await expect(page).toHaveURL(/\/transactions/);
  });
});
