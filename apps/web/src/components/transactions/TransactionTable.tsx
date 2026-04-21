import Link from 'next/link';
import { StatusBadge } from './StatusBadge';
import { SortableHeader } from './SortableHeader';
import { formatAmount, formatDate } from '@/lib/format';
import type { Transaction } from '@/lib/transactions';

interface TransactionTableProps {
  transactions: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-400">
        No transactions match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-left">
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">ID</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Merchant</th>
            <SortableHeader field="amount"    label="Amount"  />
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Card</th>
            <SortableHeader field="status"    label="Status"  />
            <SortableHeader field="createdAt" label="Date"    />
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {transactions.map((txn) => (
            <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <span className="font-mono text-xs text-gray-500">{txn.id.slice(0, 16)}…</span>
              </td>
              <td className="px-4 py-3 text-gray-700">{txn.merchantId}</td>
              <td className="px-4 py-3 font-semibold text-gray-900">
                {formatAmount(txn.amount, txn.currency)}
              </td>
              <td className="px-4 py-3 text-gray-500">
                {txn.cardBrand} ••••{txn.cardLast4}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={txn.status} />
              </td>
              <td className="px-4 py-3 text-gray-500">{formatDate(txn.createdAt)}</td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/transactions/${txn.id}`}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
                >
                  View →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
