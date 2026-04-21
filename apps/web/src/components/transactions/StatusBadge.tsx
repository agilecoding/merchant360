import { cn } from '@/lib/cn';
import type { TransactionStatus } from '@merchant360/shared-types';

const styles: Record<TransactionStatus, string> = {
  AUTHORIZED: 'bg-blue-50   text-blue-700   ring-blue-200',
  CAPTURED:   'bg-emerald-50 text-emerald-700 ring-emerald-200',
  FAILED:     'bg-red-50    text-red-700     ring-red-200',
  PENDING:    'bg-amber-50  text-amber-700   ring-amber-200',
  REFUNDED:   'bg-gray-100  text-gray-600    ring-gray-200',
  CHARGEBACK: 'bg-red-100   text-red-800     ring-red-300',
  CANCELLED:  'bg-gray-50   text-gray-400    ring-gray-100',
};

export function StatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset', styles[status])}>
      {status}
    </span>
  );
}
