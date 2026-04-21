import { type Page, expect } from '@playwright/test';

export class RefundModal {
  constructor(private readonly page: Page) {}

  get modal()          { return this.page.getByRole('dialog', { name: /issue refund/i }); }
  get amountInput()    { return this.modal.getByLabel(/refund amount/i); }
  get reasonInput()    { return this.modal.getByLabel(/reason/i); }
  get fullRefundBtn()  { return this.modal.getByRole('button', { name: /full refund/i }); }
  get reviewButton()   { return this.modal.getByRole('button', { name: /review refund/i }); }
  get confirmButton()  { return this.modal.getByRole('button', { name: /confirm refund/i }); }
  get backButton()     { return this.modal.getByRole('button', { name: /back/i }); }
  get closeButton()    { return this.modal.getByLabel(/close/i); }
  get amountError()    { return this.modal.locator('#amount-err'); }
  get partialWarning() { return this.modal.getByText(/partial refund/i); }
  get charCount()      { return this.modal.locator('span').filter({ hasText: /\/500/ }); }

  async expectOpen() {
    await expect(this.modal).toBeVisible();
  }

  async expectClosed() {
    await expect(this.modal).not.toBeVisible();
  }

  async fillAmount(amount: string) {
    await this.amountInput.fill(amount);
  }

  async fillReason(reason: string) {
    await this.reasonInput.fill(reason);
  }

  async clickFullRefund() {
    await this.fullRefundBtn.click();
  }

  async proceedToConfirm() {
    await this.reviewButton.click();
    await expect(this.confirmButton).toBeVisible();
  }

  async confirm() {
    await this.confirmButton.click();
    await this.expectClosed();
  }

  async close() {
    await this.closeButton.click();
    await this.expectClosed();
  }

  async submitRefund(amount: string, reason?: string) {
    await this.fillAmount(amount);
    if (reason) await this.fillReason(reason);
    await this.proceedToConfirm();
    await this.confirm();
  }

  /** Returns text in the confirmation summary dl */
  async getConfirmationDetail(label: string) {
    const row = this.modal.locator('dl div').filter({ hasText: label });
    return row.locator('dd').innerText();
  }
}
