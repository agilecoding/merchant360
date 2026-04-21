export type RefundStatus = 'PENDING' | 'PROCESSED' | 'FAILED' | 'CANCELLED';

export interface Refund {
  id: string;
  transactionId: string;
  merchantId: string;
  /** Amount in minor currency units — must not exceed remaining capturable balance */
  amount: number;
  /** ISO 4217 currency code — must match originating transaction */
  currency: string;
  status: RefundStatus;
  /** UUID v4 — duplicate keys are rejected (idempotency) */
  idempotencyKey: string;
  reason?: string;
  /** ISO 8601 */
  createdAt: string;
  updatedAt: string;
}

export interface CreateRefundInput {
  transactionId: string;
  amount: number;
  currency: string;
  reason?: string;
}

export interface RefundFilters {
  transactionId?: string;
  merchantId?: string;
  status?: RefundStatus;
  page?: number;
  pageSize?: number;
}
