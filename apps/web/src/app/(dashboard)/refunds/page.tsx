import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Refunds' };

export default function RefundsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Refunds</h1>
    </div>
  );
}
