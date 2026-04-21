/**
 * OAuth2 PKCE Login Tests
 *
 * Covers the full Keycloak SSO flow:
 *   1. App login page renders correctly
 *   2. SSO link initiates PKCE redirect to Keycloak
 *   3. Valid credentials → callback → session cookie → dashboard
 *   4. Invalid credentials → Keycloak error (no callback)
 *   5. Error query params on /login → user-visible messages
 *   6. Session persists across page reloads
 *   7. Protected routes redirect unauthenticated users
 *   8. Logout clears session and redirects to /login
 *   9. callbackUrl is honoured after login
 *
 * Note: imports from '../fixtures/index' but all suites override storageState
 * to unauthenticated. The capturedTxnId fixture is harmless here (payment-service
 * needs no auth) but we shadow it with a no-op to avoid the extra HTTP call.
 */

import { test as base, expect, STORAGE } from '../fixtures/index';
import { KeycloakLoginPage }             from '../pages/KeycloakLoginPage';

/**
 * Local test handle that suppresses the capturedTxnId HTTP call for this spec.
 * All other fixtures (page objects) remain available.
 */
const test = base.extend<{ capturedTxnId: string }>({
  capturedTxnId: async ({}, use) => use('__unused__'),
});

// All tests in this file start unauthenticated unless overridden
test.use({ storageState: { cookies: [], origins: [] } });

// ── 1. Login page UI ──────────────────────────────────────────────────────────
test.describe('Login page', () => {
  test('renders branding and SSO button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /merchant360/i })).toBeVisible();
    await expect(page.getByRole('link',    { name: /continue with sso/i })).toBeVisible();
    await expect(page.getByText(/sign in with your organisation/i)).toBeVisible();
  });

  test('no error state on clean visit', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('alert')).not.toBeVisible();
  });
});

// ── 2. PKCE redirect ──────────────────────────────────────────────────────────
test.describe('PKCE redirect', () => {
  test('SSO link navigates to Keycloak auth endpoint', async ({ page }) => {
    await page.goto('/login');
    const [request] = await Promise.all([
      page.waitForRequest((r) =>
        r.url().includes('/protocol/openid-connect/auth') ||
        r.url().includes('/api/auth/login'),
      ),
      page.getByRole('link', { name: /continue with sso/i }).click(),
    ]);
    expect(request.url()).toBeTruthy();
  });

  test('PKCE auth URL includes required params', async ({ page }) => {
    await page.goto('/login');

    // Fetch the auth redirect URL directly (manual mode returns the Location header)
    const keycloakUrl = await page.evaluate(async () => {
      const res = await fetch('/api/auth/login?callbackUrl=%2Fdashboard', {
        method: 'GET',
        redirect: 'manual',
      });
      return res.headers.get('location');
    });
    expect(keycloakUrl).toBeTruthy();

    const url = new URL(keycloakUrl!, 'http://localhost');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('code_challenge')).toBeTruthy();
    expect(url.searchParams.get('state')).toBeTruthy();
    expect(url.searchParams.get('scope')).toContain('openid');
  });
});

// ── 3. Successful login ───────────────────────────────────────────────────────
test.describe('Successful OAuth login', () => {
  test('admin: completes PKCE flow and lands on dashboard', async ({ page }) => {
    const kc = new KeycloakLoginPage(page);

    await page.goto('/login');
    await page.getByRole('link', { name: /continue with sso/i }).click();
    await kc.expectVisible();
    await kc.fillAndSubmit('admin@merchant360.dev', 'password');

    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('session cookie is set after login', async ({ page, context }) => {
    const kc = new KeycloakLoginPage(page);

    await page.goto('/login');
    await page.getByRole('link', { name: /continue with sso/i }).click();
    await kc.expectVisible();
    await kc.fillAndSubmit('admin@merchant360.dev', 'password');
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });

    const cookies = await context.cookies();
    const session  = cookies.find((c) => c.name === 'm360_session');
    expect(session).toBeDefined();
    expect(session?.httpOnly).toBe(true);
    expect(session?.sameSite).toMatch(/lax|strict/i);
  });

  test('analyst: lands on dashboard after login', async ({ page }) => {
    const kc = new KeycloakLoginPage(page);

    await page.goto('/login');
    await page.getByRole('link', { name: /continue with sso/i }).click();
    await kc.expectVisible();
    await kc.fillAndSubmit('analyst@merchant360.dev', 'password');
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('merchant: lands on dashboard after login', async ({ page }) => {
    const kc = new KeycloakLoginPage(page);

    await page.goto('/login');
    await page.getByRole('link', { name: /continue with sso/i }).click();
    await kc.expectVisible();
    await kc.fillAndSubmit('merchant@merchant360.dev', 'password');
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

// ── 4. Invalid credentials ────────────────────────────────────────────────────
test.describe('Invalid credentials', () => {
  test('wrong password stays on Keycloak with error', async ({ page }) => {
    const kc = new KeycloakLoginPage(page);

    await page.goto('/login');
    await page.getByRole('link', { name: /continue with sso/i }).click();
    await kc.expectVisible();
    await kc.fillAndSubmit('admin@merchant360.dev', 'wrongpassword');
    await kc.expectError();
    await expect(page).not.toHaveURL(/\/dashboard/);
  });

  test('unknown user stays on Keycloak with error', async ({ page }) => {
    const kc = new KeycloakLoginPage(page);

    await page.goto('/login');
    await page.getByRole('link', { name: /continue with sso/i }).click();
    await kc.expectVisible();
    await kc.fillAndSubmit('nobody@nowhere.dev', 'password');
    await kc.expectError();
  });
});

// ── 5. Error query params ─────────────────────────────────────────────────────
test.describe('Login page error states', () => {
  test('auth_failed param shows error alert', async ({ page }) => {
    await page.goto('/login?error=auth_failed');
    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/sign-in failed/i);
  });

  test('invalid_state param shows error alert', async ({ page }) => {
    await page.goto('/login?error=invalid_state');
    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/authentication failed/i);
  });

  test('access_denied param shows error alert', async ({ page }) => {
    await page.goto('/login?error=access_denied');
    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/access denied/i);
  });

  test('unknown error code shows generic message', async ({ page }) => {
    await page.goto('/login?error=some_unknown_code');
    await expect(page.getByRole('alert')).toContainText(/an error occurred/i);
  });
});

// ── 6. Session persistence ────────────────────────────────────────────────────
test.describe('Session persistence', () => {
  test.use({ storageState: STORAGE.admin });

  test('authenticated user stays logged in after reload', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('authenticated user is not redirected to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).not.toHaveURL(/\/login/);
  });
});

// ── 7. Protected route redirect ───────────────────────────────────────────────
test.describe('Protected routes', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('unauthenticated /dashboard → /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated /transactions → /login', async ({ page }) => {
    await page.goto('/transactions');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated /admin → /login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirect preserves callbackUrl param', async ({ page }) => {
    await page.goto('/transactions?page=2');
    await expect(page).toHaveURL(/\/login/);
    const url = new URL(page.url());
    expect(url.searchParams.get('callbackUrl')).toContain('/transactions');
  });
});

// ── 8. Logout ─────────────────────────────────────────────────────────────────
test.describe('Logout', () => {
  test.use({ storageState: STORAGE.admin });

  test('logout clears session and redirects to /login', async ({ page, context }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    // Trigger logout via API route (UserMenu posts to /api/auth/logout)
    await page.evaluate(async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
    });

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);

    const cookies = await context.cookies();
    const session  = cookies.find((c) => c.name === 'm360_session');
    expect(session).toBeUndefined();
  });
});

// ── 9. callbackUrl honoured ───────────────────────────────────────────────────
test.describe('callbackUrl redirect', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('deep-link is restored after login', async ({ page }) => {
    const kc = new KeycloakLoginPage(page);

    // Arrive at a protected deep-link while unauthenticated
    await page.goto('/transactions?status=CAPTURED&page=1');
    await expect(page).toHaveURL(/\/login/);

    // Complete SSO
    await page.getByRole('link', { name: /continue with sso/i }).click();
    await kc.expectVisible();
    await kc.fillAndSubmit('admin@merchant360.dev', 'password');

    // Should land on /transactions (middleware captures pathname as callbackUrl)
    await page.waitForURL(/\/transactions/, { timeout: 20_000 });
    await expect(page).toHaveURL(/\/transactions/);
  });

  test('login without callbackUrl defaults to /dashboard', async ({ page }) => {
    const kc = new KeycloakLoginPage(page);

    await page.goto('/login');
    await page.getByRole('link', { name: /continue with sso/i }).click();
    await kc.expectVisible();
    await kc.fillAndSubmit('admin@merchant360.dev', 'password');

    await page.waitForURL(/\/(dashboard|transactions)/, { timeout: 20_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
