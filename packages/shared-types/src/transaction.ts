export type TransactionStatus =
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'FAILED'
  | 'PENDING'
  | 'REFUNDED'
  | 'CHARGEBACK'
  | 'CANCELLED';

export type CardBrand = 'Visa' | 'Mastercard' | 'Amex' | 'Discover' | 'UnionPay' | 'Unknown';

export interface Transaction {
  id: string;
  merchantId: string;
  /** Amount in minor currency units (e.g. cents) */
  amount: number;
  /** ISO 4217 currency code */
  currency: string;
  status: TransactionStatus;
  /** Last 4 digits only — never full PAN */
  cardLast4: string;
  cardBrand: CardBrand;
  /** ISO 8601 */
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, string>;
}

export interface CreateTransactionInput {
  merchantId: string;
  amount: number;
  currency: string;
  cardToken: string;
  metadata?: Record<string, string>;
}

export interface TransactionFilters {
  merchantId?: string;
  status?: TransactionStatus;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}
