import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { TransactionTableSkeleton } from '@/components/transactions/TransactionTableSkeleton';
import { Pagination } from '@/components/transactions/Pagination';
import { fetchTransactions } from '@/lib/transactions';
import type { TransactionStatus } from '@merchant360/shared-types';

export const metadata: Metadata = { title: 'Transactions' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: {
    page?:       string;
    status?:     string;
    merchantId?: string;
    from?:       string;
    to?:         string;
    sortField?:  string;
    sortDir?:    string;
  };
}

async function TransactionGrid({ searchParams }: PageProps) {
  const page      = Math.max(1, Number(searchParams.page ?? 1));
  const sortField = (searchParams.sortField ?? 'createdAt') as 'createdAt' | 'amount' | 'status';
  const sortDir   = (searchParams.sortDir   ?? 'desc')      as 'asc' | 'desc';

  const result = await fetchTransactions({
    page,
    pageSize: PAGE_SIZE,
    filters: {
      status:     (searchParams.status     as TransactionStatus) || undefined,
      merchantId: searchParams.merchantId  || undefined,
      from:       searchParams.from        || undefined,
      to:         searchParams.to          || undefined,
    },
    sort: { field: sortField, direction: sortDir },
  });

  return (
    <>
      <TransactionTable transactions={result.data} />
      <Pagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        hasNextPage={result.hasNextPage}
      />
    </>
  );
}

export default function TransactionsPage({ searchParams }: PageProps) {
  const activeFilters = [
    searchParams.status,
    searchParams.merchantId,
    searchParams.from,
    searchParams.to,
  ].filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="mt-0.5 text-sm text-gray-500">All payment records across merchants</p>
        </div>
        {activeFilters > 0 && (
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
            {activeFilters} filter{activeFilters > 1 ? 's' : ''} active
          </span>
        )}
      </div>

      {/* ── Filters — client component, no Suspense needed ─────────── */}
      <Suspense>
        <TransactionFilters />
      </Suspense>

      {/* ── Table + pagination — server component with streaming ────── */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <Suspense fallback={<TransactionTableSkeleton rows={PAGE_SIZE} />}>
          <TransactionGrid searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
