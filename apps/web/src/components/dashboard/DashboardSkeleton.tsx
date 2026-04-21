export function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="h-1 w-full rounded bg-gray-100" />
      <div className="mt-4 h-3 w-32 rounded bg-gray-100" />
      <div className="mt-3 h-8 w-24 rounded bg-gray-100" />
      <div className="mt-2 h-2.5 w-20 rounded bg-gray-100" />
    </div>
  );
}

export function RateGaugeSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="h-3 w-28 rounded bg-gray-100" />
        <div className="h-7 w-16 rounded bg-gray-100" />
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-gray-100" />
    </div>
  );
}

export function AlertFeedSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <ul className="divide-y divide-gray-100">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="animate-pulse flex items-start gap-3 py-3">
          <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-24 rounded bg-gray-100" />
            <div className="h-3 w-3/4 rounded bg-gray-100" />
            <div className="h-2.5 w-20 rounded bg-gray-100" />
          </div>
        </li>
      ))}
    </ul>
  );
}
