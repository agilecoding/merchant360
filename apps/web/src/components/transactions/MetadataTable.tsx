interface MetadataTableProps {
  metadata: Record<string, string>;
}

export function MetadataTable({ metadata }: MetadataTableProps) {
  const entries = Object.entries(metadata);

  if (entries.length === 0) {
    return <p className="py-4 text-sm text-gray-400">No metadata attached.</p>;
  }

  return (
    <dl className="divide-y divide-gray-100">
      {entries.map(([key, value]) => (
        <div key={key} className="grid grid-cols-5 gap-4 py-2.5">
          <dt className="col-span-2 text-xs font-medium text-gray-400 break-all">{key}</dt>
          <dd className="col-span-3 font-mono text-xs text-gray-700 break-all">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
