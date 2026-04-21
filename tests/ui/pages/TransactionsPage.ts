import { type Page, expect } from '@playwright/test';

export class TransactionsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/transactions');
  }

  // ── Filters ──────────────────────────────────────────────────────────────────
  get statusFilter()     { return this.page.getByRole('combobox').first(); }
  get merchantInput()    { return this.page.getByRole('textbox', { name: /merchant id/i }); }
  get currencyFilter()   { return this.page.getByLabel(/currency/i); }
  get fromDateFilter()   { return this.page.getByLabel(/from/i); }
  get toDateFilter()     { return this.page.getByLabel(/to/i); }
  get searchInput()      { return this.page.getByRole('searchbox'); }
  get filterBadge()      { return this.page.getByText(/filter.*active/i); }

  async filterByStatus(status: string) {
    await this.statusFilter.selectOption(status);
    await this.page.waitForURL(new RegExp(`status=${status}`));
  }

  async clearFilters() {
    await this.page.getByRole('button', { name: /clear filters/i }).click();
    await this.page.waitForURL(/\/transactions$/);
  }

  // ── Table ────────────────────────────────────────────────────────────────────
  get tableRows()  { return this.page.locator('tbody tr'); }
  get emptyState() { return this.page.getByText(/no transactions/i); }

  async rowCount() {
    return this.tableRows.count();
  }

  async clickRow(index: number) {
    await this.tableRows.nth(index).getByRole('link', { name: /view/i }).click();
    await this.page.waitForURL(/\/transactions\/.+/);
  }

  async getRowStatus(index: number) {
    return this.tableRows.nth(index).locator('[data-testid="status-badge"]').innerText();
  }

  // ── Sort ─────────────────────────────────────────────────────────────────────
  async sortBy(column: string) {
    await this.page.getByRole('columnheader', { name: new RegExp(column, 'i') }).click();
  }

  // ── Pagination ───────────────────────────────────────────────────────────────
  get nextButton() { return this.page.getByRole('button', { name: /next/i }); }
  get prevButton() { return this.page.getByRole('button', { name: /prev/i }); }

  async nextPage() {
    const currentUrl = this.page.url();
    await this.nextButton.click();
    await this.page.waitForURL((url) => url.toString() !== currentUrl);
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/transactions/);
    await expect(this.tableRows.first().or(this.emptyState)).toBeVisible();
  }
}
