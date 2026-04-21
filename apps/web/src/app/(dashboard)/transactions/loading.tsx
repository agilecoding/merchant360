import { TransactionTableSkeleton } from '@/components/transactions/TransactionTableSkeleton';

export default function TransactionsLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="h-8 w-44 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
      </div>
      {/* Filter bar skeleton */}
      <div className="flex gap-3">
        {[112, 120, 120, 128].map((w, i) => (
          <div key={i} className={`h-9 w-[${w}px] animate-pulse rounded-md bg-gray-100`} />
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <TransactionTableSkeleton rows={10} />
      </div>
    </div>
  );
}
