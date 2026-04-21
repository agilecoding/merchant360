import { test, expect, STORAGE } from '../fixtures/index';

test.describe('Refund modal — admin', () => {
  test.use({ storageState: STORAGE.admin });

  test.beforeEach(async ({ capturedTxnId, transactionDetailPage, refundModal }) => {
    await transactionDetailPage.goto(capturedTxnId);
    await transactionDetailPage.expectLoaded();
    await transactionDetailPage.openRefundModal();
    await refundModal.expectOpen();
  });

  test('opens with empty form', async ({ refundModal }) => {
    await expect(refundModal.amountInput).toHaveValue('');
  });

  test('full refund button populates amount', async ({ refundModal }) => {
    await refundModal.clickFullRefund();
    const value = await refundModal.amountInput.inputValue();
    expect(parseFloat(value)).toBeGreaterThan(0);
  });

  test('shows partial refund warning', async ({ refundModal }) => {
    await refundModal.clickFullRefund();
    const full = parseFloat(await refundModal.amountInput.inputValue());
    await refundModal.fillAmount(String((full / 2).toFixed(2)));
    await expect(refundModal.partialWarning).toBeVisible();
  });

  test('validates amount > 0', async ({ refundModal }) => {
    await refundModal.fillAmount('0');
    await refundModal.reviewButton.click();
    await expect(refundModal.amountError).toBeVisible();
  });

  test('validates amount <= max', async ({ refundModal }) => {
    await refundModal.fillAmount('999999999');
    await refundModal.reviewButton.click();
    await expect(refundModal.amountError).toContainText(/cannot exceed/i);
  });

  test('confirm step shows correct details', async ({ refundModal }) => {
    await refundModal.clickFullRefund();
    await refundModal.fillReason('Customer request');
    await refundModal.proceedToConfirm();
    const type   = await refundModal.getConfirmationDetail('Type');
    const reason = await refundModal.getConfirmationDetail('Reason');
    expect(type).toMatch(/full refund/i);
    expect(reason).toBe('Customer request');
  });

  test('back button returns to form', async ({ refundModal }) => {
    await refundModal.clickFullRefund();
    await refundModal.proceedToConfirm();
    await refundModal.backButton.click();
    await expect(refundModal.reviewButton).toBeVisible();
  });

  test('close button dismisses modal', async ({ refundModal }) => {
    await refundModal.close();
  });
});

test.describe('Refund modal — analyst role', () => {
  test.use({ storageState: STORAGE.analyst });

  test('analyst does not see refund button', async ({ capturedTxnId, transactionDetailPage }) => {
    await transactionDetailPage.goto(capturedTxnId);
    await transactionDetailPage.expectLoaded();
    await expect(transactionDetailPage.refundButton).not.toBeVisible();
  });
});
