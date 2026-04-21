import { type Page, expect } from '@playwright/test';

export class DashboardPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/dashboard');
  }

  get heading()     { return this.page.getByRole('heading', { name: /dashboard/i }); }
  get statCards()   { return this.page.locator('[data-testid="stat-card"]'); }
  get alertFeed()   { return this.page.locator('[data-testid="alert-feed"]'); }

  navLink(label: string) {
    return this.page.getByRole('link', { name: new RegExp(label, 'i') });
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible();
  }

  async navigateTo(section: 'transactions' | 'merchants' | 'refunds' | 'disputes' | 'admin') {
    await this.navLink(section).click();
    await this.page.waitForURL(new RegExp(`/${section}`));
  }
}
