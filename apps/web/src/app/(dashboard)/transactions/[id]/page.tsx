import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatusBadge } from '@/components/transactions/StatusBadge';
import { TransactionTimeline } from '@/components/transactions/TransactionTimeline';
import { RefundHistory } from '@/components/transactions/RefundHistory';
import { MetadataTable } from '@/components/transactions/MetadataTable';
import { RefundButton } from '@/components/refunds/RefundButton';
import { formatAmount, formatDate } from '@/lib/format';
import { fetchTransactionDetail } from '@/lib/transaction-detail';

export const metadata: Metadata = { title: 'Transaction Detail' };
export const dynamic = 'force-dynamic';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

export default async function TransactionDetailPage({ params }: { params: { id: string } }) {
  const txn = await fetchTransactionDetail(params.id);
  if (!txn) notFound();

  const isRefundable = txn.status === 'CAPTURED' || txn.status === 'AUTHORIZED';
  const totalRefunded = txn.refunds
    .filter((r) => r.status === 'PROCESSED')
    .reduce((sum, r) => sum + r.amount, 0);
  const refundable = txn.amount - totalRefunded;

  return (
    <div className="max-w-3xl space-y-6">
      {/* ── Breadcrumb ─────────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/transactions" className="hover:text-brand-600">Transactions</Link>
        <span>/</span>
        <span className="font-mono text-gray-600">{params.id.slice(0, 20)}…</span>
      </nav>

      {/* ── Page header ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaction Detail</h1>
          <p className="mt-0.5 font-mono text-xs text-gray-400">{params.id}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={txn.status} />
          {isRefundable && refundable > 0 && (
            <RefundButton
              transactionId={txn.id}
              maxAmountCents={refundable}
              currency={txn.currency}
            />
          )}
        </div>
      </div>

      {/* ── Summary card ────────────────────────────────────────────── */}
      <Section title="Summary">
        <dl className="divide-y divide-gray-100">
          {[
            ['Transaction ID',  <span key="id" className="font-mono text-xs">{txn.id}</span>],
            ['Merchant',        txn.merchantId],
            ['Amount',          <span key="amt" className="font-semibold text-gray-900">{formatAmount(txn.amount, txn.currency)}</span>],
            ['Refundable',      <span key="ref" className={refundable < txn.amount ? 'text-amber-600 font-medium' : ''}>{formatAmount(refundable, txn.currency)}</span>],
            ['Currency',        txn.currency],
            ['Status',          <StatusBadge key="s" status={txn.status} />],
            ['Card',            (
              <span key="card" className="flex items-center gap-2">
                <span className="inline-flex h-6 w-9 items-center justify-center rounded border border-gray-200 bg-gray-50 text-xs font-bold text-gray-600">
                  {txn.cardBrand.slice(0,4).toUpperCase()}
                </span>
                {/* Card number — always masked, never full PAN */}
                <span className="font-mono text-gray-700">•••• •••• •••• {txn.cardLast4}</span>
              </span>
            )],
            ['Created',         formatDate(txn.createdAt)],
            ['Last Updated',    formatDate(txn.updatedAt)],
          ].map(([label, value]) => (
            <div key={String(label)} className="grid grid-cols-3 gap-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</dt>
              <dd className="col-span-2 text-sm text-gray-800">{value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* ── Timeline ────────────────────────────────────────────────── */}
      <Section title="Timeline">
        <TransactionTimeline events={txn.timeline} />
      </Section>

      {/* ── Refund history ─────────────────────────────────────────── */}
      <Section title={`Refund History${txn.refunds.length > 0 ? ` (${txn.refunds.length})` : ''}`}>
        <RefundHistory
          refunds={txn.refunds}
          transactionAmount={txn.amount}
          currency={txn.currency}
        />
      </Section>

      {/* ── Metadata ────────────────────────────────────────────────── */}
      <Section title="Metadata">
        <MetadataTable metadata={txn.metadata ?? {}} />
      </Section>
    </div>
  );
}
