'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import type { TransactionStatus } from '@merchant360/shared-types';

const STATUSES: TransactionStatus[] = [
  'AUTHORIZED','CAPTURED','FAILED','PENDING','REFUNDED','CHARGEBACK','CANCELLED',
];

export function TransactionFilters() {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  const set = useCallback((key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    p.set('page', '1');
    router.push(`${pathname}?${p}` as any);
  }, [router, pathname, searchParams]);

  return (
    <div className="flex flex-wrap gap-3">
      {/* Status */}
      <select
        value={searchParams.get('status') ?? ''}
        onChange={(e) => set('status', e.target.value)}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      {/* From date */}
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-medium text-gray-500">From</label>
        <input
          type="date"
          value={searchParams.get('from') ?? ''}
          onChange={(e) => set('from', e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {/* To date */}
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-medium text-gray-500">To</label>
        <input
          type="date"
          value={searchParams.get('to') ?? ''}
          onChange={(e) => set('to', e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {/* Merchant */}
      <input
        type="text"
        placeholder="Merchant ID"
        value={searchParams.get('merchantId') ?? ''}
        onChange={(e) => set('merchantId', e.target.value)}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 w-36"
      />

      {/* Clear */}
      {(searchParams.get('status') || searchParams.get('from') || searchParams.get('to') || searchParams.get('merchantId')) && (
        <button
          onClick={() => router.push(pathname as any)}
          className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
