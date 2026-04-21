'use client';

import { useState, useTransition } from 'react';
import { toast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/format';
import type { Merchant, MerchantStatus } from '@/lib/admin';

const STATUSES: MerchantStatus[] = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];

const statusBadge: Record<MerchantStatus, string> = {
  ACTIVE:    'bg-green-100  text-green-700',
  INACTIVE:  'bg-gray-100   text-gray-500',
  SUSPENDED: 'bg-red-100    text-red-700',
};

interface Props { merchants: Merchant[] }

export function MerchantsTable({ merchants }: Props) {
  const [rows, setRows]            = useState(merchants);
  const [pending, startTransition] = useTransition();

  async function handleStatusChange(id: string, status: MerchantStatus) {
    const prev = rows.find((m) => m.id === id)?.status;
    setRows((r) => r.map((m) => m.id === id ? { ...m, status } : m));

    startTransition(async () => {
      const res = await fetch(`/api/admin/merchants/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setRows((r) => r.map((m) => m.id === id ? { ...m, status: prev! } : m));
        toast('error', 'Update failed', 'Could not update merchant status.');
      } else {
        toast('success', 'Status updated', `Merchant status set to ${status}.`);
      }
    });
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
          <tr>
            {['ID', 'Name', 'Email', 'Country', 'Currency', 'Created', 'Status'].map((h) => (
              <th key={h} className="px-4 py-3 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {rows.map((m) => (
            <tr key={m.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-xs text-gray-400">{m.id}</td>
              <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
              <td className="px-4 py-3 text-gray-600">{m.email}</td>
              <td className="px-4 py-3 text-gray-600">{m.country}</td>
              <td className="px-4 py-3 text-gray-600">{m.currency}</td>
              <td className="px-4 py-3 text-gray-500 tabular-nums">{formatDate(m.createdAt)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge[m.status]}`}>
                    {m.status}
                  </span>
                  <select
                    value={m.status}
                    disabled={pending}
                    onChange={(e) => handleStatusChange(m.id, e.target.value as MerchantStatus)}
                    className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
                    aria-label={`Change status for ${m.name}`}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
