import { StatCardSkeleton, RateGaugeSkeleton, AlertFeedSkeleton } from '@/components/dashboard/DashboardSkeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-36 animate-pulse rounded bg-gray-200" />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>

      {/* Rate gauges + alerts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <RateGaugeSkeleton />
        <RateGaugeSkeleton />
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 h-4 w-28 animate-pulse rounded bg-gray-100" />
          <AlertFeedSkeleton />
        </div>
      </div>
    </div>
  );
}
