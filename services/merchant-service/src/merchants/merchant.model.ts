import { ObjectId } from 'mongodb';
import type { MerchantStatus } from '@merchant360/shared-types';

export interface MerchantDoc {
  _id: ObjectId;
  merchantId: string;
  name: string;
  email: string;
  status: MerchantStatus;
  country: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export const COLLECTION = 'merchants';
