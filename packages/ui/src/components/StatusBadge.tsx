import { Badge } from './Badge.js';
import type { TransactionStatus } from '@merchant360/shared-types';

const statusVariant: Record<TransactionStatus, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  AUTHORIZED: 'info',
  CAPTURED: 'success',
  FAILED: 'error',
  PENDING: 'warning',
  REFUNDED: 'default',
  CHARGEBACK: 'error',
  CANCELLED: 'default',
};

export function StatusBadge({ status }: { status: TransactionStatus }) {
  return <Badge variant={statusVariant[status]}>{status}</Badge>;
}
