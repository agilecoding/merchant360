import { type Page, expect } from '@playwright/test';

export class TransactionDetailPage {
  constructor(public readonly page: Page) {}

  async goto(id: string) {
    await this.page.goto(`/transactions/${id}`);
  }

  get heading()       { return this.page.getByRole('heading', { level: 1 }); }
  get status()        { return this.page.locator('[data-testid="status-badge"]'); }
  get timeline()      { return this.page.locator('[data-testid="timeline"]'); }
  get refundHistory() { return this.page.locator('[data-testid="refund-history"]'); }
  get metadataTable() { return this.page.locator('[data-testid="metadata-table"]'); }
  get refundButton()  { return this.page.getByRole('button', { name: /refund/i }); }
  get breadcrumb()    { return this.page.locator('nav[aria-label="breadcrumb"]'); }

  async expectLoaded(id?: string) {
    if (id) await this.page.waitForURL(`**/transactions/${id}`);
    await expect(this.heading).toBeVisible();
  }

  async expectTimelineEvents(count: number) {
    await expect(this.timeline.locator('li')).toHaveCount(count);
  }

  async openRefundModal() {
    // Ensure the refund button is visible and enabled before clicking
    await expect(this.refundButton).toBeVisible();
    await this.refundButton.click();
  }

  async goBack() {
    await this.breadcrumb.getByRole('link', { name: /transactions/i }).click();
    await this.page.waitForURL(/\/transactions$/);
  }
}
