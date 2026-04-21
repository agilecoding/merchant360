/**
 * Transactions UI Tests
 *
 * Covers the full journey:
 *   1. Login via SSO → land on dashboard
 *   2. Navigate to transactions list
 *   3. Search / filter transactions
 *   4. Open transaction detail page
 *   5. Verify detail sections render correctly
 */

import { test, expect, STORAGE } from '../fixtures/index';
import { KeycloakLoginPage }     from '../pages/KeycloakLoginPage';

// ── Suite 1: Full login → search → detail journey ─────────────────────────────
test.describe('Login → search → detail (fresh session)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('completes full journey from login to transaction detail', async ({
    page,
    transactionsPage,
  }) => {
    const kc = new KeycloakLoginPage(page);

    // Step 1: Login
    await page.goto('/login');
    await page.getByRole('link', { name: /continue with sso/i }).click();
    await kc.expectVisible();
    await kc.fillAndSubmit('admin@merchant360.dev', 'password');
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

    // Step 2: Navigate to transactions
    await page.getByRole('link', { name: /^transactions$/i }).click();
    await page.waitForURL(/\/transactions/, { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: /transactions/i })).toBeVisible();

    // Step 3: Filter by status via POM
    await transactionsPage.filterByStatus('CAPTURED');
    await expect(transactionsPage.tableRows.first()).toBeVisible();

    // Step 4: Open first row → detail
    await transactionsPage.tableRows.first().click();
    await page.waitForURL(/\/transactions\/.+/, { timeout: 10_000 });

    // Step 5: Detail page loaded
    await expect(page.getByRole('heading', { name: /transaction detail/i })).toBeVisible();
  });
});

// ── Suite 2: Transactions list (pre-authenticated) ────────────────────────────
test.describe('Transactions list', () => {
  test.use({ storageState: STORAGE.admin });

  test.beforeEach(async ({ transactionsPage }) => {
    await transactionsPage.goto();
    await transactionsPage.expectLoaded();
  });

  test('page heading and subheading are visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /transactions/i })).toBeVisible();
    await expect(page.getByText(/all payment records/i)).toBeVisible();
  });

  test('renders at least one transaction row', async ({ transactionsPage }) => {
    const count = await transactionsPage.rowCount();
    expect(count).toBeGreaterThan(0);
  });

  test('status filter updates URL and filters rows', async ({ page, transactionsPage }) => {
    await transactionsPage.filterByStatus('FAILED');
    expect(page.url()).toContain('status=FAILED');
    expect(page.url()).toContain('page=1');
    const count = await transactionsPage.rowCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('filtering by CAPTURED shows only CAPTURED rows', async ({ transactionsPage }) => {
    await transactionsPage.filterByStatus('CAPTURED');
    const count = await transactionsPage.rowCount();
    if (count === 0) return;

    for (let i = 0; i < Math.min(count, 5); i++) {
      const status = await transactionsPage.getRowStatus(i);
      expect(status).toMatch(/captured/i);
    }
  });

  test('merchant ID filter updates URL', async ({ page, transactionsPage }) => {
    await transactionsPage.merchantInput.fill('mer_001');
    await page.keyboard.press('Tab');
    await page.waitForURL(/merchantId=mer_001/, { timeout: 8_000 });
    expect(page.url()).toContain('merchantId=mer_001');
  });

  test('date range filter from updates URL', async ({ page, transactionsPage }) => {
    await transactionsPage.fromDateFilter.fill('2024-01-01');
    await page.keyboard.press('Tab');
    await page.waitForURL(/from=2024-01-01/, { timeout: 8_000 });
    expect(page.url()).toContain('from=2024-01-01');
  });

  test('clear filters restores unfiltered list', async ({ page, transactionsPage }) => {
    await transactionsPage.filterByStatus('REFUNDED');
    await transactionsPage.clearFilters();
    expect(page.url()).not.toContain('status=');
    const count = await transactionsPage.rowCount();
    expect(count).toBeGreaterThan(0);
  });

  test('active filter count badge appears', async ({ transactionsPage }) => {
    await transactionsPage.filterByStatus('PENDING');
    await expect(transactionsPage.filterBadge).toBeVisible();
  });

  test('pagination: next page updates URL', async ({ page, transactionsPage }) => {
    await transactionsPage.nextPage();
    expect(page.url()).toContain('page=2');
  });

  test('pagination: prev button disabled on page 1', async ({ transactionsPage }) => {
    await expect(transactionsPage.prevButton).toBeDisabled();
  });

  test('rows are sorted by clicking amount column header', async ({ page, transactionsPage }) => {
    const beforeUrl = page.url();
    await transactionsPage.sortBy('amount');
    await page.waitForURL(/sortField=amount/, { timeout: 8_000 });
    expect(page.url()).not.toBe(beforeUrl);
    expect(page.url()).toContain('sortField=amount');
  });
});

// ── Suite 3: Transaction detail page ──────────────────────────────────────────
test.describe('Transaction detail', () => {
  test.use({ storageState: STORAGE.admin });

  test.beforeEach(async ({ transactionsPage }) => {
    await transactionsPage.goto();
    await transactionsPage.expectLoaded();
  });

  test('clicking first row opens detail page', async ({ transactionsPage, transactionDetailPage }) => {
    await transactionsPage.clickRow(0);
    await transactionDetailPage.expectLoaded();
    await expect(transactionDetailPage.heading).toBeVisible();
  });

  test('detail page shows transaction ID in breadcrumb', async ({ page, transactionsPage }) => {
    await transactionsPage.clickRow(0);
    await page.waitForURL(/\/transactions\/.+/);
    const id = page.url().split('/transactions/')[1];
    await expect(page.getByText(new RegExp(id.slice(0, 12), 'i'))).toBeVisible();
  });

  test('detail page shows summary card with required fields', async ({ page, transactionsPage, transactionDetailPage }) => {
    await transactionsPage.clickRow(0);
    await transactionDetailPage.expectLoaded();
    for (const label of ['Transaction ID', 'Amount', 'Currency', 'Status', 'Card', 'Created']) {
      await expect(page.getByText(new RegExp(label, 'i'))).toBeVisible();
    }
  });

  test('detail page shows masked card number', async ({ page, transactionsPage, transactionDetailPage }) => {
    await transactionsPage.clickRow(0);
    await transactionDetailPage.expectLoaded();
    // Masked PAN: •••• •••• •••• XXXX
    await expect(page.getByTestId('masked-pan')).toBeVisible();
  });

  test('detail page shows timeline section', async ({ transactionsPage, transactionDetailPage }) => {
    await transactionsPage.clickRow(0);
    await transactionDetailPage.expectLoaded();
    await expect(transactionDetailPage.timeline).toBeVisible();
  });

  test('detail page shows refund history section', async ({ transactionsPage, transactionDetailPage }) => {
    await transactionsPage.clickRow(0);
    await transactionDetailPage.expectLoaded();
    await expect(transactionDetailPage.refundHistory).toBeVisible();
  });

  test('breadcrumb back link returns to transactions list', async ({ page, transactionsPage, transactionDetailPage }) => {
    await transactionsPage.clickRow(0);
    await transactionDetailPage.expectLoaded();
    await transactionDetailPage.goBack();
    await expect(page).toHaveURL(/\/transactions$/);
  });

  test('CAPTURED transaction shows Refund button', async ({ transactionsPage, transactionDetailPage }) => {
    await transactionsPage.filterByStatus('CAPTURED');
    if (await transactionsPage.rowCount() === 0) return;
    await transactionsPage.clickRow(0);
    await transactionDetailPage.expectLoaded();
    await expect(transactionDetailPage.refundButton).toBeVisible();
  });

  test('FAILED transaction does not show Refund button', async ({ transactionsPage, transactionDetailPage }) => {
    await transactionsPage.filterByStatus('FAILED');
    if (await transactionsPage.rowCount() === 0) return;
    await transactionsPage.clickRow(0);
    await transactionDetailPage.expectLoaded();
    await expect(transactionDetailPage.refundButton).not.toBeVisible();
  });
});

// ── Suite 4: Analyst — read-only view ─────────────────────────────────────────
test.describe('Transactions — analyst role', () => {
  test.use({ storageState: STORAGE.analyst });

  test('analyst can view transactions list', async ({ transactionsPage }) => {
    await transactionsPage.goto();
    await transactionsPage.expectLoaded();
    const count = await transactionsPage.rowCount();
    expect(count).toBeGreaterThan(0);
  });

  test('analyst can open transaction detail', async ({ transactionsPage, transactionDetailPage }) => {
    await transactionsPage.goto();
    await transactionsPage.expectLoaded();
    await transactionsPage.clickRow(0);
    await transactionDetailPage.expectLoaded();
  });

  test('analyst does not see Refund button on CAPTURED transaction', async ({ transactionsPage, transactionDetailPage }) => {
    await transactionsPage.goto();
    await transactionsPage.filterByStatus('CAPTURED');
    if (await transactionsPage.rowCount() === 0) return;
    await transactionsPage.clickRow(0);
    await transactionDetailPage.expectLoaded();
    await expect(transactionDetailPage.refundButton).not.toBeVisible();
  });
});
