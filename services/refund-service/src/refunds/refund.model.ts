import { ObjectId } from 'mongodb';
import type { RefundStatus, TransactionStatus } from '@merchant360/shared-types';

export interface RefundDoc {
  _id: ObjectId;
  refundId: string;
  transactionId: string;
  merchantId: string;
  amount: number;
  currency: string;
  status: RefundStatus;
  idempotencyKey: string;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionDoc {
  _id: ObjectId;
  transactionId: string;
  merchantId: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  refundedAmount: number; // cumulative cents refunded
}

export const REFUNDS_COL      = 'refunds';
export const TRANSACTIONS_COL = 'transactions';
