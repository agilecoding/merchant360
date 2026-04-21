import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Merchants' };

export default function MerchantsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Merchants</h1>
    </div>
  );
}
