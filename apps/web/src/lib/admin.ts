import { gqlFetch } from './gql-client';
import type { User, UserRole, Merchant, MerchantStatus } from '@merchant360/shared-types';

export type { User, UserRole, Merchant, MerchantStatus };

// ── Users ─────────────────────────────────────────────────────────────────────
const USERS_QUERY = /* GraphQL */ `
  query AdminUsers {
    users {
      id email role merchantId
    }
  }
`;

const UPDATE_ROLE_MUTATION = /* GraphQL */ `
  mutation UpdateUserRole($id: String!, $role: String!) {
    updateUserRole(id: $id, role: $role) { id email role }
  }
`;

// ── Merchants ─────────────────────────────────────────────────────────────────
const MERCHANTS_QUERY = /* GraphQL */ `
  query AdminMerchants {
    merchants(page: 1, pageSize: 100) {
      data { id name email status country currency createdAt updatedAt }
    }
  }
`;

const UPDATE_MERCHANT_MUTATION = /* GraphQL */ `
  mutation UpdateMerchantStatus($id: String!, $status: String!) {
    updateMerchantStatus(id: $id, status: $status) { id name status }
  }
`;

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_USERS: User[] = [
  { id: 'usr_001', email: 'admin@merchant360.dev',    role: 'admin'    },
  { id: 'usr_002', email: 'analyst@merchant360.dev',  role: 'analyst'  },
  { id: 'usr_003', email: 'merchant@merchant360.dev', role: 'merchant', merchantId: 'mer_001' },
  { id: 'usr_004', email: 'merchant2@merchant360.dev',role: 'merchant', merchantId: 'mer_002' },
];

const MOCK_MERCHANTS: Merchant[] = [
  { id: 'mer_001', name: 'Acme Payments Ltd',   email: 'ops@acme.example',          status: 'ACTIVE',    country: 'US', currency: 'USD', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'mer_002', name: 'GlobalShop Inc',       email: 'finance@globalshop.example', status: 'ACTIVE',    country: 'GB', currency: 'GBP', createdAt: '2024-03-15T00:00:00Z', updatedAt: '2024-03-15T00:00:00Z' },
  { id: 'mer_003', name: 'Nordic Retail AS',     email: 'billing@nordic.example',    status: 'ACTIVE',    country: 'NO', currency: 'EUR', createdAt: '2024-04-01T00:00:00Z', updatedAt: '2024-04-01T00:00:00Z' },
  { id: 'mer_004', name: 'PacRim Commerce Pte',  email: 'accounts@pacrim.example',   status: 'INACTIVE',  country: 'SG', currency: 'SGD', createdAt: '2024-05-10T00:00:00Z', updatedAt: '2024-05-10T00:00:00Z' },
  { id: 'mer_005', name: 'Horizon Ventures LLC', email: 'pay@horizon.example',       status: 'SUSPENDED', country: 'US', currency: 'USD', createdAt: '2024-06-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z' },
];

export async function fetchAdminUsers(): Promise<User[]> {
  try {
    const data = await gqlFetch<{ users: User[] }>({ query: USERS_QUERY });
    return data.users;
  } catch {
    return MOCK_USERS;
  }
}

export async function fetchAdminMerchants(): Promise<Merchant[]> {
  try {
    const data = await gqlFetch<{ merchants: { data: Merchant[] } }>({ query: MERCHANTS_QUERY });
    return data.merchants.data;
  } catch {
    return MOCK_MERCHANTS;
  }
}

export async function updateUserRole(id: string, role: UserRole): Promise<void> {
  await gqlFetch({ query: UPDATE_ROLE_MUTATION, variables: { id, role } }).catch(() => null);
}

export async function updateMerchantStatus(id: string, status: MerchantStatus): Promise<void> {
  await gqlFetch({ query: UPDATE_MERCHANT_MUTATION, variables: { id, status } }).catch(() => null);
}
