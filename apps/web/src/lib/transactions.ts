import { gqlFetch } from './gql-client';
import type { Transaction, TransactionStatus, PaginatedResponse } from '@merchant360/shared-types';

export type { Transaction, TransactionStatus };

export interface TransactionFilters {
  status?: TransactionStatus;
  merchantId?: string;
  from?: string;
  to?: string;
  search?: string;
}

export interface TransactionSort {
  field: 'createdAt' | 'amount' | 'status';
  direction: 'asc' | 'desc';
}

export interface TransactionQuery {
  page: number;
  pageSize: number;
  filters: TransactionFilters;
  sort: TransactionSort;
}

const TRANSACTIONS_QUERY = /* GraphQL */ `
  query Transactions(
    $page: Int!
    $pageSize: Int!
    $status: String
    $merchantId: String
    $from: String
    $to: String
    $search: String
    $sortField: String
    $sortDir: String
  ) {
    transactions(
      page: $page
      pageSize: $pageSize
      status: $status
      merchantId: $merchantId
      from: $from
      to: $to
      search: $search
      sortField: $sortField
      sortDir: $sortDir
    ) {
      data {
        id
        merchantId
        amount
        currency
        status
        cardLast4
        cardBrand
        createdAt
        updatedAt
      }
      total
      page
      pageSize
      hasNextPage
    }
  }
`;

// Mock data for dev
function makeMockTransactions(
  page: number,
  pageSize: number,
  filters: TransactionFilters,
): PaginatedResponse<Transaction> {
  const STATUSES: TransactionStatus[] = ['AUTHORIZED','CAPTURED','FAILED','PENDING','REFUNDED','CHARGEBACK','CANCELLED'];
  const BRANDS  = ['Visa','Mastercard','Amex','Discover','UnionPay','Unknown'] as const;
  const LAST4   = ['4242','1234','5678','9999','3782'];
  const MERCH   = ['mer_001','mer_002','mer_003','mer_004'];
  const ALL     = Array.from({ length: 200 }, (_, i) => ({
    id:         `txn_${String(i + 1).padStart(6, '0')}`,
    merchantId: MERCH[i % MERCH.length],
    amount:     (i + 1) * 1337 % 250_000 + 100,
    currency:   'USD',
    status:     STATUSES[i % STATUSES.length],
    cardLast4:  LAST4[i % LAST4.length],
    cardBrand:  BRANDS[i % BRANDS.length],
    createdAt:  new Date(Date.now() - i * 3_600_000).toISOString(),
    updatedAt:  new Date(Date.now() - i * 3_600_000 + 60_000).toISOString(),
  } satisfies Transaction));

  const filtered = ALL.filter((t) => {
    if (filters.status     && t.status     !== filters.status)     return false;
    if (filters.merchantId && t.merchantId !== filters.merchantId) return false;
    if (filters.from       && t.createdAt  <  filters.from)        return false;
    if (filters.to         && t.createdAt  >  filters.to)          return false;
    return true;
  });

  const start = (page - 1) * pageSize;
  return {
    data:        filtered.slice(start, start + pageSize),
    total:       filtered.length,
    page,
    pageSize,
    hasNextPage: start + pageSize < filtered.length,
  };
}

export async function fetchTransactions(q: TransactionQuery): Promise<PaginatedResponse<Transaction>> {
  try {
    const data = await gqlFetch<{ transactions: PaginatedResponse<Transaction> }>({
      query: TRANSACTIONS_QUERY,
      variables: {
        page:       q.page,
        pageSize:   q.pageSize,
        status:     q.filters.status     ?? null,
        merchantId: q.filters.merchantId ?? null,
        from:       q.filters.from       ?? null,
        to:         q.filters.to         ?? null,
        search:     q.filters.search     ?? null,
        sortField:  q.sort.field,
        sortDir:    q.sort.direction,
      },
    });
    return data.transactions;
  } catch {
    return makeMockTransactions(q.page, q.pageSize, q.filters);
  }
}