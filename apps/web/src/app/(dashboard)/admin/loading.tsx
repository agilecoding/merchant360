export default function AdminLoading() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      <div className="h-6 w-20 rounded bg-gray-200" />
      {[0, 1].map((i) => (
        <div key={i} className="space-y-3">
          <div className="h-4 w-28 rounded bg-gray-200" />
          <div className="h-48 rounded-lg bg-gray-100" />
        </div>
      ))}
    </div>
  );
}
