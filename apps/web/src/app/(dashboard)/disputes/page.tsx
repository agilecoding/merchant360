import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Disputes' };

export default function DisputesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Disputes & Chargebacks</h1>
    </div>
  );
}
