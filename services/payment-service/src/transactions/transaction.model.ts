import { ObjectId } from 'mongodb';
import type { TransactionStatus, CardBrand } from '@merchant360/shared-types';

export interface TransactionDoc {
  _id: ObjectId;
  transactionId: string;
  merchantId: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  cardLast4: string;
  cardBrand: CardBrand;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export const COLLECTION = 'transactions';
