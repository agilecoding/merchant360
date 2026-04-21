export type MerchantStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface Merchant {
  id: string;
  name: string;
  email: string;
  status: MerchantStatus;
  /** ISO 3166-1 alpha-2 country code */
  country: string;
  /** ISO 4217 default settlement currency */
  currency: string;
  /** ISO 8601 */
  createdAt: string;
  updatedAt: string;
}

export interface UpdateMerchantInput {
  name?: string;
  email?: string;
  status?: MerchantStatus;
}

export interface MerchantFilters {
  status?: MerchantStatus;
  country?: string;
  page?: number;
  pageSize?: number;
}
