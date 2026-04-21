'use client';

import { useState, useCallback, useId } from 'react';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { formatAmount } from '@/lib/format';
import { issueRefund } from '@/lib/refunds';

type Step = 'form' | 'confirm';

interface RefundModalProps {
  open: boolean;
  onClose: () => void;
  transactionId: string;
  maxAmountCents: number;
  currency: string;
  onSuccess?: () => void;
}

interface FormState {
  amountDisplay: string; // dollars/display value
  reason: string;
}

interface FormErrors {
  amount?: string;
  reason?: string;
}

function validate(state: FormState, maxCents: number): FormErrors {
  const errors: FormErrors = {};
  const cents = Math.round(parseFloat(state.amountDisplay) * 100);
  if (!state.amountDisplay || isNaN(cents) || cents <= 0) {
    errors.amount = 'Enter a valid amount greater than 0.';
  } else if (cents > maxCents) {
    errors.amount = `Cannot exceed ${formatAmount(maxCents, 'USD')} (refundable balance).`;
  }
  if (state.reason.length > 500) {
    errors.reason = 'Reason must be 500 characters or fewer.';
  }
  return errors;
}

export function RefundModal({
  open,
  onClose,
  transactionId,
  maxAmountCents,
  currency,
  onSuccess,
}: RefundModalProps) {
  const formId = useId();
  const [step, setStep]       = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [form, setForm]       = useState<FormState>({ amountDisplay: '', reason: '' });
  const [errors, setErrors]   = useState<FormErrors>({});

  const amountCents = Math.round(parseFloat(form.amountDisplay) * 100) || 0;
  const isPartial   = amountCents > 0 && amountCents < maxAmountCents;

  function handleClose() {
    setStep('form');
    setForm({ amountDisplay: '', reason: '' });
    setErrors({});
    onClose();
  }

  function handleReview(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form, maxAmountCents);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep('confirm');
  }

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    const idempotencyKey = crypto.randomUUID();
    const result = await issueRefund({
      transactionId,
      amount:         amountCents,
      currency,
      reason:         form.reason || undefined,
      idempotencyKey,
    });
    setLoading(false);

    if (result.success) {
      toast('success', 'Refund submitted', `${formatAmount(amountCents, currency)} refund is pending processing.`);
      handleClose();
      onSuccess?.();
    } else {
      toast('error', 'Refund failed', result.error ?? 'An unexpected error occurred.');
      setStep('form');
    }
  }, [transactionId, amountCents, currency, form.reason, onSuccess]);

  const inputClass = 'w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500';

  return (
    <Modal open={open} onClose={handleClose} title="Issue Refund" size="md">
      {step === 'form' ? (
        <form id={formId} onSubmit={handleReview} className="space-y-5" noValidate>
          {/* Amount */}
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <label htmlFor="refund-amount" className="text-sm font-medium text-gray-700">
                Refund Amount ({currency})
              </label>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, amountDisplay: (maxAmountCents / 100).toFixed(2) }))}
                className="text-xs text-brand-600 hover:underline"
              >
                Full refund ({formatAmount(maxAmountCents, currency)})
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-sm text-gray-400">$</span>
              <input
                id="refund-amount"
                type="number"
                min="0.01"
                max={(maxAmountCents / 100).toFixed(2)}
                step="0.01"
                placeholder="0.00"
                value={form.amountDisplay}
                onChange={(e) => setForm((f) => ({ ...f, amountDisplay: e.target.value }))}
                className={`${inputClass} pl-7 ${errors.amount ? 'border-red-400' : 'border-gray-300'}`}
                aria-describedby={errors.amount ? 'amount-err' : undefined}
              />
            </div>
            {errors.amount && (
              <p id="amount-err" role="alert" className="text-xs text-red-600">{errors.amount}</p>
            )}
            {isPartial && !errors.amount && (
              <p className="text-xs text-amber-600">
                Partial refund — {formatAmount(maxAmountCents - amountCents, currency)} will remain refundable.
              </p>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label htmlFor="refund-reason" className="text-sm font-medium text-gray-700">
              Reason <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="refund-reason"
              rows={3}
              maxLength={500}
              placeholder="e.g. Customer request — item returned"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              className={`${inputClass} resize-none ${errors.reason ? 'border-red-400' : 'border-gray-300'}`}
            />
            <div className="flex justify-between">
              {errors.reason
                ? <p role="alert" className="text-xs text-red-600">{errors.reason}</p>
                : <span />}
              <span className="text-xs text-gray-400">{form.reason.length}/500</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={handleClose}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit"
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Review Refund
            </button>
          </div>
        </form>

      ) : (
        /* ── Confirmation step ─────────────────────────────────────── */
        <div className="space-y-5">
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Confirm Refund Details</p>
            <dl className="divide-y divide-gray-200 text-sm">
              {[
                ['Transaction', <span key="tid" className="font-mono text-xs">{transactionId.slice(0, 20)}…</span>],
                ['Refund Amount', <span key="amt" className="font-bold text-gray-900">{formatAmount(amountCents, currency)}</span>],
                ['Type', isPartial ? 'Partial refund' : 'Full refund'],
                ...(form.reason ? [['Reason', form.reason]] : []),
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between gap-4 py-2">
                  <dt className="text-gray-500">{k}</dt>
                  <dd className="text-gray-800 text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
            This action cannot be undone. The refund will be submitted immediately.
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => setStep('form')} disabled={loading}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              ← Back
            </button>
            <button onClick={handleConfirm} disabled={loading}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 min-w-[120px]">
              {loading ? 'Submitting…' : 'Confirm Refund'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
