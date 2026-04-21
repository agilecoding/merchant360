export function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6 max-w-3xl">
      <div className="h-4 w-48 rounded bg-gray-200" />
      <div className="flex items-center justify-between">
        <div className="h-8 w-64 rounded bg-gray-200" />
        <div className="h-6 w-24 rounded-full bg-gray-100" />
      </div>
      {/* Summary card */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid grid-cols-3 gap-4">
            <div className="h-3 w-20 rounded bg-gray-100" />
            <div className="col-span-2 h-3 w-40 rounded bg-gray-100" />
          </div>
        ))}
      </div>
      {/* Timeline */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-3 w-3 rounded-full bg-gray-200 mt-1" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-32 rounded bg-gray-100" />
              <div className="h-2.5 w-48 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
