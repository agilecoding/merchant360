import { test, expect } from '../fixtures/index';

test.use({ storageState: { cookies: [], origins: [] } }); // unauthenticated

test.describe('Login flow', () => {
  test('unauthenticated user is redirected to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('admin can log in via SSO and reach dashboard', async ({ loginPage, dashboardPage }) => {
    await loginPage.goto();
    await loginPage.page.getByRole('link', { name: /continue with sso/i }).click();
    await loginPage.fillCredentials('admin@merchant360.dev', 'password');
    await loginPage.submit();
    await loginPage.expectRedirectedToDashboard();
    await dashboardPage.expectLoaded();
  });

  test('invalid credentials show error', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.page.getByRole('link', { name: /continue with sso/i }).click();
    await loginPage.fillCredentials('bad@user.com', 'wrongpassword');
    await loginPage.submit();
    await loginPage.expectError(/invalid/i);
  });

  test('ESC key does not break login page', async ({ page, loginPage }) => {
    await loginPage.goto();
    await page.keyboard.press('Escape');
    await loginPage.expectLoginPage();
  });
});
