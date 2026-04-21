import { type Page, expect } from '@playwright/test';

/**
 * Represents the Keycloak mock login form.
 * In dev/test the Keycloak container serves a standard login UI at
 * /realms/{realm}/protocol/openid-connect/auth
 */
export class KeycloakLoginPage {
  constructor(private readonly page: Page) {}

  get usernameInput() { return this.page.getByLabel(/username/i); }
  get passwordInput() { return this.page.getByRole('textbox', { name: /password/i }); }
  get submitButton()  { return this.page.getByRole('button', { name: /sign in/i }); }
  get errorAlert()    { return this.page.getByRole('alert'); }

  async fillAndSubmit(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectVisible() {
    await expect(this.submitButton).toBeVisible({ timeout: 10_000 });
  }

  async expectError() {
    await expect(this.errorAlert).toBeVisible({ timeout: 5_000 });
  }
}
