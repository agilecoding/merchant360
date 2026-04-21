'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/cn';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  hasNextPage: boolean;
}

export function Pagination({ page, pageSize, total, hasNextPage }: PaginationProps) {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(total / pageSize);
  const start      = (page - 1) * pageSize + 1;
  const end        = Math.min(page * pageSize, total);

  function go(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`${pathname}?${params}` as any);
  }

  const btnBase = 'px-3 py-1.5 text-sm rounded-md border font-medium transition-colors';

  return (
    <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
      <p className="text-xs text-gray-400">
        {start}–{end} of {total.toLocaleString()} results
      </p>
      <div className="flex items-center gap-1.5">
        <button
          disabled={page <= 1}
          onClick={() => go(page - 1)}
          className={cn(btnBase, 'border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed')}
        >
          ← Prev
        </button>

        {/* Page window */}
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i));
          return (
            <button
              key={p}
              onClick={() => go(p)}
              className={cn(
                btnBase,
                p === page
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50',
              )}
            >
              {p}
            </button>
          );
        })}

        <button
          disabled={!hasNextPage}
          onClick={() => go(page + 1)}
          className={cn(btnBase, 'border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed')}
        >
          Next →
        </button>
      </div>
    </div>
  )
}
