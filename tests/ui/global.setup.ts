import { test as setup, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// fileURLToPath avoids the double-drive-letter bug (C:\C:\...) on Windows
// that occurs when using import.meta.dirname / URL.pathname with path.join
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const ADMIN_AUTH    = path.join(__dirname, 'fixtures/auth/admin.json');
const ANALYST_AUTH  = path.join(__dirname, 'fixtures/auth/analyst.json');
const MERCHANT_AUTH = path.join(__dirname, 'fixtures/auth/merchant.json');

/**
 * Authenticates each persona once and saves storageState.
 * Subsequent test workers load the saved state — no repeated logins.
 */
setup('authenticate admin', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('link', { name: /continue with sso/i }).click();
  await page.getByLabel(/username/i).fill('admin@merchant360.dev');
  await page.getByRole('textbox', { name: /password/i }).fill('password');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/);
  await expect(page).toHaveURL(/\/dashboard/);
  await page.context().storageState({ path: ADMIN_AUTH });
});

setup('authenticate analyst', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('link', { name: /continue with sso/i }).click();
  await page.getByLabel(/username/i).fill('analyst@merchant360.dev');
  await page.getByRole('textbox', { name: /password/i }).fill('password');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/);
  await page.context().storageState({ path: ANALYST_AUTH });
});

setup('authenticate merchant', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('link', { name: /continue with sso/i }).click();
  await page.getByLabel(/username/i).fill('merchant@merchant360.dev');
  await page.getByRole('textbox', { name: /password/i }).fill('password');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/);
  await page.context().storageState({ path: MERCHANT_AUTH });
});
