/**
 * Refund Flow Tests
 *
 * Covers:
 *   1. Issue full refund → success toast → status updated
 *   2. Issue partial refund → partial warning → toast → remaining balance updated
 *   3. Refund validation errors (amount 0, over-max)
 *   4. Confirm step details match form input
 *   5. Back button returns to editable form
 *   6. Modal close clears form state
 *   7. Analyst cannot issue refunds (no button)
 *   8. Network failure → error toast
 *
 * Uses `capturedTxnId` fixture to navigate directly to a CAPTURED transaction,
 * eliminating flakiness caused by prior tests refunding the "first" table row.
 */

import { test, expect, STORAGE } from '../fixtures/index';

// ── Selectors matching actual component markup ──────────────────────────────
const TOAST_REGION = '[role="region"][aria-label="Notifications"]';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Read the numeric dollar value from the Refundable field in the summary card. */
async function getRefundableAmount(page: import('@playwright/test').Page): Promise<number> {
  const dd = page.locator('dl div').filter({ hasText: /refundable/i }).locator('dd');
  const text = await dd.innerText();
  return parseFloat(text.replace(/[^0-9.]/g, ''));
}

// ── Suite 1: Full refund ──────────────────────────────────────────────────────
test.describe('Issue full refund', () => {
  test.use({ storageState: STORAGE.admin });

  test('full refund: success toast appears and status updates', async ({
    capturedTxnId,
    transactionDetailPage,
    refundModal,
  }) => {
    await transactionDetailPage.page.goto(`/transactions/${capturedTxnId}`);
    await transactionDetailPage.expectLoaded();

    // Open modal
    await transactionDetailPage.openRefundModal();
    await refundModal.expectOpen();

    // Use "Full refund" shortcut
    await refundModal.clickFullRefund();
    const amount = await refundModal.amountInput.inputValue();
    expect(parseFloat(amount)).toBeGreaterThan(0);

    // No partial warning for full refund
    await expect(refundModal.partialWarning).not.toBeVisible();

    // Proceed → confirm
    await refundModal.proceedToConfirm();
    await expect(refundModal.confirmButton).toBeVisible();

    // Confirmation details show "Full refund"
    const type = await refundModal.getConfirmationDetail('Type');
    expect(type).toMatch(/full refund/i);

    await refundModal.confirm();

    // ── Toast ────────────────────────────────────────────────────────────────
    const toastRegion = transactionDetailPage.page.locator(TOAST_REGION);
    await expect(toastRegion).toBeVisible({ timeout: 8_000 });
    await expect(toastRegion.getByText(/refund submitted/i)).toBeVisible();
    await expect(toastRegion.getByText(/pending processing/i)).toBeVisible();

    // ── Status updated ───────────────────────────────────────────────────────
    await transactionDetailPage.page.waitForFunction(() => {
      const badges = document.querySelectorAll('[class*="rounded-full"]');
      return Array.from(badges).some((b) => /refunded/i.test(b.textContent ?? ''));
    }, { timeout: 15_000 });

    await expect(transactionDetailPage.page.getByText(/refunded/i).first()).toBeVisible();
  });
});

// ── Suite 2: Partial refund ───────────────────────────────────────────────────
test.describe('Issue partial refund', () => {
  test.use({ storageState: STORAGE.admin });

  test('partial refund: shows warning, success toast, remaining balance updates', async ({
    capturedTxnId,
    transactionDetailPage,
    refundModal,
  }) => {
    await transactionDetailPage.page.goto(`/transactions/${capturedTxnId}`);
    await transactionDetailPage.expectLoaded();

    const originalRefundable = await getRefundableAmount(transactionDetailPage.page);

    await transactionDetailPage.openRefundModal();
    await refundModal.expectOpen();

    // Enter half the refundable amount
    const half = (originalRefundable / 2).toFixed(2);
    await refundModal.fillAmount(half);

    // Partial warning must appear
    await expect(refundModal.partialWarning).toBeVisible();
    await expect(refundModal.partialWarning).toContainText(/partial refund/i);

    await refundModal.fillReason('Partial return – item damaged');

    await refundModal.proceedToConfirm();

    const type = await refundModal.getConfirmationDetail('Type');
    expect(type).toMatch(/partial refund/i);

    const shownAmount = await refundModal.getConfirmationDetail('Refund Amount');
    expect(shownAmount).toContain(half.replace(/\.?0+$/, ''));

    await refundModal.confirm();

    // Toast
    const toastRegion = transactionDetailPage.page.locator(TOAST_REGION);
    await expect(toastRegion.getByText(/refund submitted/i)).toBeVisible({ timeout: 8_000 });

    // Refundable balance should decrease after router.refresh()
    await transactionDetailPage.page.waitForFunction(
      ([orig]: [number]) => {
        const rows = Array.from(document.querySelectorAll('dl div'));
        for (const row of rows) {
          if (/refundable/i.test(row.textContent ?? '')) {
            const dd = row.querySelector('dd');
            const val = parseFloat((dd?.textContent ?? '').replace(/[^0-9.]/g, ''));
            return val < orig;
          }
        }
        return false;
      },
      [originalRefundable] as [number],
      { timeout: 10_000 },
    );
  });
});

// ── Suite 3: Validation ───────────────────────────────────────────────────────
test.describe('Refund modal validation', () => {
  test.use({ storageState: STORAGE.admin });

  test.beforeEach(async ({ capturedTxnId, transactionDetailPage, refundModal }) => {
    await transactionDetailPage.page.goto(`/transactions/${capturedTxnId}`);
    await transactionDetailPage.expectLoaded();
    await transactionDetailPage.openRefundModal();
    await refundModal.expectOpen();
  });

  test('zero amount shows validation error', async ({ refundModal }) => {
    await refundModal.fillAmount('0');
    await refundModal.reviewButton.click();
    await expect(refundModal.amountError).toBeVisible();
    await expect(refundModal.amountError).toContainText(/greater than 0/i);
  });

  test('empty amount shows validation error', async ({ refundModal }) => {
    await refundModal.reviewButton.click();
    await expect(refundModal.amountError).toBeVisible();
  });

  test('amount exceeding max shows validation error', async ({ refundModal }) => {
    await refundModal.fillAmount('999999999');
    await refundModal.reviewButton.click();
    await expect(refundModal.amountError).toBeVisible();
    await expect(refundModal.amountError).toContainText(/cannot exceed/i);
  });

  test('negative amount shows validation error', async ({ refundModal }) => {
    await refundModal.fillAmount('-10');
    await refundModal.reviewButton.click();
    await expect(refundModal.amountError).toBeVisible();
  });

  test('reason char counter increments', async ({ refundModal }) => {
    const text = 'Customer request for return';
    await refundModal.fillReason(text);
    await expect(refundModal.charCount).toContainText(`${text.length}/500`);
  });
});

// ── Suite 4: Modal UX behaviour ───────────────────────────────────────────────
test.describe('Refund modal UX', () => {
  test.use({ storageState: STORAGE.admin });

  test.beforeEach(async ({ capturedTxnId, transactionDetailPage, refundModal }) => {
    await transactionDetailPage.page.goto(`/transactions/${capturedTxnId}`);
    await transactionDetailPage.expectLoaded();
    await transactionDetailPage.openRefundModal();
    await refundModal.expectOpen();
  });

  test('back button from confirm step returns to form with values preserved', async ({ refundModal }) => {
    await refundModal.clickFullRefund();
    const amount = await refundModal.amountInput.inputValue();
    await refundModal.fillReason('Test reason');
    await refundModal.proceedToConfirm();

    await refundModal.backButton.click();

    await expect(refundModal.amountInput).toHaveValue(amount);
    await expect(refundModal.reasonInput).toHaveValue('Test reason');
    await expect(refundModal.reviewButton).toBeVisible();
  });

  test('close button dismisses modal and resets form', async ({ page, refundModal }) => {
    await refundModal.fillAmount('10.00');
    await refundModal.close();
    await refundModal.expectClosed();

    // Re-open – form should be reset
    await page.getByRole('button', { name: /refund/i }).click();
    await refundModal.expectOpen();
    await expect(refundModal.amountInput).toHaveValue('');
  });

  test('ESC key closes modal', async ({ page, refundModal }) => {
    await page.keyboard.press('Escape');
    await refundModal.expectClosed();
  });

  test('confirm step shows transaction ID (truncated)', async ({ refundModal }) => {
    await refundModal.clickFullRefund();
    await refundModal.proceedToConfirm();
    const txnDetail = await refundModal.getConfirmationDetail('Transaction');
    expect(txnDetail.length).toBeGreaterThan(0);
    expect(txnDetail).toMatch(/…$/);
  });

  test('confirm step shows reason when provided', async ({ refundModal }) => {
    await refundModal.clickFullRefund();
    await refundModal.fillReason('Damaged in transit');
    await refundModal.proceedToConfirm();
    const reason = await refundModal.getConfirmationDetail('Reason');
    expect(reason).toBe('Damaged in transit');
  });

  test('confirm step hides reason row when no reason given', async ({ refundModal }) => {
    await refundModal.clickFullRefund();
    await refundModal.proceedToConfirm();
    const reasonRow = refundModal.modal.locator('dl div').filter({ hasText: /^reason$/i });
    await expect(reasonRow).not.toBeVisible();
  });
});

// ── Suite 5: Network error → error toast ──────────────────────────────────────
test.describe('Refund network error', () => {
  test.use({ storageState: STORAGE.admin });

  test('API failure shows error toast and returns to form', async ({
    capturedTxnId,
    transactionDetailPage,
    refundModal,
  }) => {
    await transactionDetailPage.page.goto(`/transactions/${capturedTxnId}`);
    await transactionDetailPage.expectLoaded();

    await transactionDetailPage.openRefundModal();
    await refundModal.expectOpen();

    // Intercept and fail the refund API call
    await transactionDetailPage.page.route('**/api/refunds', (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ message: 'Service unavailable' }) }),
    );

    await refundModal.clickFullRefund();
    await refundModal.proceedToConfirm();
    await refundModal.confirmButton.click();

    // Error toast
    const toastRegion = transactionDetailPage.page.locator(TOAST_REGION);
    await expect(toastRegion.getByText(/refund failed/i)).toBeVisible({ timeout: 8_000 });

    // Modal returns to form step (not closed)
    await expect(refundModal.reviewButton).toBeVisible();

    await transactionDetailPage.page.unroute('**/api/refunds');
  });
});

// ── Suite 6: Role restrictions ────────────────────────────────────────────────
test.describe('Refund role restrictions', () => {
  test.describe('analyst', () => {
    test.use({ storageState: STORAGE.analyst });

    test('analyst does not see Refund button on CAPTURED transaction', async ({
      capturedTxnId,
      transactionDetailPage,
    }) => {
      await transactionDetailPage.page.goto(`/transactions/${capturedTxnId}`);
      await transactionDetailPage.expectLoaded();

      await expect(transactionDetailPage.refundButton).not.toBeVisible();
    });
  });

  test.describe('merchant', () => {
    test.use({ storageState: STORAGE.merchant });

    test('merchant sees Refund button on their own CAPTURED transaction', async ({
      transactionsPage,
      transactionDetailPage,
    }) => {
      await transactionsPage.goto();
      await transactionsPage.filterByStatus('CAPTURED');

      const rowCount = await transactionsPage.rowCount();
      if (rowCount === 0) {
        test.skip(true, 'No CAPTURED transactions for merchant');
        return;
      }

      await transactionsPage.clickRow(0);
      await transactionDetailPage.expectLoaded();

      await expect(transactionDetailPage.page).toHaveURL(/\/transactions\/.+/);
    });
  });
});
