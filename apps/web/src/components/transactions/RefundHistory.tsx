import { formatAmount, formatDate } from '@/lib/format';
import type { Refund } from '@merchant360/shared-types';

const refundStatusStyle: Record<Refund['status'], string> = {
  PENDING:   'bg-amber-50  text-amber-700  ring-amber-200',
  PROCESSED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  FAILED:    'bg-red-50    text-red-700    ring-red-200',
  CANCELLED: 'bg-gray-100  text-gray-500   ring-gray-200',
};

interface RefundHistoryProps {
  refunds: Refund[];
  transactionAmount: number;
  currency: string;
}

export function RefundHistory({ refunds, transactionAmount, currency }: RefundHistoryProps) {
  if (refunds.length === 0) {
    return (
      <p className="py-4 text-sm text-gray-400">No refunds issued for this transaction.</p>
    );
  }

  const totalRefunded = refunds
    .filter((r) => r.status === 'PROCESSED')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5 text-sm">
        <span className="text-gray-500">
          Total refunded:{' '}
          <span className="font-semibold text-gray-800">{formatAmount(totalRefunded, currency)}</span>
        </span>
        <span className="text-gray-400">
          of {formatAmount(transactionAmount, currency)}
        </span>
      </div>

      {/* Refund rows */}
      <div className="divide-y divide-gray-100">
        {refunds.map((r) => (
          <div key={r.id} className="py-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-gray-400">{r.id}</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${refundStatusStyle[r.status]}`}>
                    {r.status}
                  </span>
                </div>
                {r.reason && (
                  <p className="mt-1 text-sm text-gray-600">{r.reason}</p>
                )}
                <p className="mt-0.5 text-xs text-gray-400">
                  Idempotency key: <span className="font-mono">{r.idempotencyKey}</span>
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-semibold text-gray-800">{formatAmount(r.amount, r.currency)}</p>
                <p className="text-xs text-gray-400">{formatDate(r.createdAt)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
