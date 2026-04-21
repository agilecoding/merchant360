import { type Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private readonly _page: Page) {}

  get page() { return this._page; }

  async goto() {
    await this._page.goto('/login');
  }

  /** Clicks the SSO button which redirects to Keycloak mock login. */
  async clickSso() {
    await this._page.getByRole('link', { name: /continue with sso/i }).click();
  }

  async fillCredentials(username: string, password: string) {
    await this._page.getByLabel(/username/i).fill(username);
    await this._page.getByRole('textbox', { name: /password/i }).fill(password);
  }

  async submit() {
    await this._page.getByRole('button', { name: /sign in/i }).click();
  }

  async login(username: string, password: string) {
    await this.goto();
    await this.clickSso();
    await this.fillCredentials(username, password);
    await this.submit();
  }

  async expectRedirectedToDashboard() {
    await this._page.waitForURL(/\/dashboard/, { timeout: 15_000 });
  }

  async expectError(text: RegExp | string) {
    await expect(this._page.getByText(text)).toBeVisible();
  }

  async expectLoginPage() {
    await expect(this._page).toHaveURL(/\/login/);
  }
}
