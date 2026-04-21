import { test as base, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { LoginPage }             from '../pages/LoginPage';
import { DashboardPage }         from '../pages/DashboardPage';
import { TransactionsPage }      from '../pages/TransactionsPage';
import { TransactionDetailPage } from '../pages/TransactionDetailPage';
import { RefundModal }           from '../pages/RefundModal';
import { test as withCapturedTxn } from './capturedTransaction';

export { expect };

interface Pages {
  loginPage:             LoginPage;
  dashboardPage:         DashboardPage;
  transactionsPage:      TransactionsPage;
  transactionDetailPage: TransactionDetailPage;
  refundModal:           RefundModal;
  /** ID of a guaranteed-CAPTURED transaction, resolved before each test. */
  capturedTxnId:         string;
}

/**
 * Default fixture — uses admin storageState (set in playwright.config.ts).
 * Use `test.use({ storageState: ... })` in a spec to switch persona.
 *
 * Includes `capturedTxnId` for refund-flow tests that need a deterministic
 * CAPTURED transaction rather than filtering the table at runtime.
 */
export const test = withCapturedTxn.extend<Omit<Pages, 'capturedTxnId'>>({
  loginPage:             async ({ page }, use) => use(new LoginPage(page)),
  dashboardPage:         async ({ page }, use) => use(new DashboardPage(page)),
  transactionsPage:      async ({ page }, use) => use(new TransactionsPage(page)),
  transactionDetailPage: async ({ page }, use) => use(new TransactionDetailPage(page)),
  refundModal:           async ({ page }, use) => use(new RefundModal(page)),
});

// fileURLToPath handles the file:///C:/... → C:\... conversion on Windows
// correctly, avoiding the double-drive-letter bug from URL.pathname + path.join
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export const STORAGE = {
  admin:    path.join(__dirname, 'auth/admin.json'),
  analyst:  path.join(__dirname, 'auth/analyst.json'),
  merchant: path.join(__dirname, 'auth/merchant.json'),
};
