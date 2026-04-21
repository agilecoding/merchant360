export function TransactionTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            {['ID','Merchant','Amount','Card','Status','Date',''].map((h, i) => (
              <th key={i} className="px-4 py-3">
                <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td className="px-4 py-3"><div className="h-3 w-28 animate-pulse rounded bg-gray-100" /></td>
              <td className="px-4 py-3"><div className="h-3 w-20 animate-pulse rounded bg-gray-100" /></td>
              <td className="px-4 py-3"><div className="h-3 w-16 animate-pulse rounded bg-gray-100" /></td>
              <td className="px-4 py-3"><div className="h-3 w-24 animate-pulse rounded bg-gray-100" /></td>
              <td className="px-4 py-3"><div className="h-5 w-20 animate-pulse rounded-full bg-gray-100" /></td>
              <td className="px-4 py-3"><div className="h-3 w-28 animate-pulse rounded bg-gray-100" /></td>
              <td className="px-4 py-3"><div className="h-3 w-10 animate-pulse rounded bg-gray-100 ml-auto" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
