import { test, expect, STORAGE } from '../fixtures/index';

test.describe('Transaction grid', () => {
  test.beforeEach(async ({ transactionsPage }) => {
    await transactionsPage.goto();
    await transactionsPage.expectLoaded();
  });

  test('renders transaction rows', async ({ transactionsPage }) => {
    const count = await transactionsPage.rowCount();
    expect(count).toBeGreaterThan(0);
  });

  test('filters by status', async ({ transactionsPage }) => {
    await transactionsPage.filterByStatus('CAPTURED');
    const count = await transactionsPage.rowCount();
    expect(count).toBeGreaterThan(0);
    const status = await transactionsPage.getRowStatus(0);
    expect(status).toMatch(/captured/i);
  });

  test('clears filters and restores full list', async ({ transactionsPage }) => {
    await transactionsPage.filterByStatus('FAILED');
    const filteredCount = await transactionsPage.rowCount();
    await transactionsPage.clearFilters();
    const fullCount = await transactionsPage.rowCount();
    expect(fullCount).toBeGreaterThanOrEqual(filteredCount);
  });

  test('navigates to detail on row click', async ({ transactionsPage, transactionDetailPage }) => {
    await transactionsPage.clickRow(0);
    await transactionDetailPage.expectLoaded();
  });

  test('pagination advances to next page', async ({ transactionsPage, page }) => {
    const url1 = page.url();
    await transactionsPage.nextPage();
    const url2 = page.url();
    expect(url2).not.toBe(url1);
    expect(url2).toMatch(/page=2/);
  });
});

test.describe('Transaction grid â€” analyst role', () => {
  test.use({ storageState: STORAGE.analyst });

  test('analyst can view transactions', async ({ transactionsPage }) => {
    await transactionsPage.goto();
    await transactionsPage.expectLoaded();
    const count = await transactionsPage.rowCount();
    expect(count).toBeGreaterThan(0);
  });
});


test('completes full journey from login to transaction detail', async ({ page, transactionsPage }) => {
  // ...

  // Step 4: Open first row → detail
  await transactionsPage.tableRows.first().click();
  expect(page.url()).toContain('/transactions/');

  await expect(page.getByRole('heading', { name: /transaction detail/i })).toHaveText(/Transaction Detail/);

 // Add an additional assertion to ensure the detail page is loaded
  await expect(page.getByRole('heading', { name: /transaction detail/i })).toHaveText(/Transaction Detail/);
});