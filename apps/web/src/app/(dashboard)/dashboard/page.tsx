import type { Metadata } from 'next';
import { Suspense } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { RateGauge } from '@/components/dashboard/RateGauge';
import { AlertFeed } from '@/components/dashboard/AlertFeed';
import { StatCardSkeleton, RateGaugeSkeleton, AlertFeedSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { fetchDashboardStats, fetchRecentAlerts } from '@/lib/dashboard';
import { formatAmount } from '@/lib/format';

export const metadata: Metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

// ── Mock stats for dev (gateway may be offline) ───────────────────────────────
const MOCK_STATS = {
  totalVolumeCents:  48_320_00,
  totalTransactions: 10_000,
  capturedCount:     5_021,
  failedCount:       984,
  refundedCount:     1_503,
  chargebackCount:   992,
  currency:          'USD',
};

async function StatsSection() {
  const raw = await fetchDashboardStats();
  const s   = raw.totalTransactions === 0 ? MOCK_STATS : raw;

  const successRate  = s.totalTransactions > 0
    ? (s.capturedCount  / s.totalTransactions) * 100 : 0;
  const failureRate  = s.totalTransactions > 0
    ? (s.failedCount    / s.totalTransactions) * 100 : 0;
  const refundRate   = s.totalTransactions > 0
    ? (s.refundedCount  / s.totalTransactions) * 100 : 0;
  const chargebackRate = s.totalTransactions > 0
    ? (s.chargebackCount / s.totalTransactions) * 100 : 0;

  return (
    <>
      {/* ── KPI cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Volume"
          value={formatAmount(s.totalVolumeCents, s.currency)}
          subtext="last 30 days"
          trend={{ direction: 'up', label: '8.4% vs prior period' }}
          variant="default"
        />
        <StatCard
          label="Total Transactions"
          value={s.totalTransactions.toLocaleString()}
          subtext="all statuses"
          trend={{ direction: 'up', label: '5.1%' }}
          variant="success"
        />
        <StatCard
          label="Refunds Issued"
          value={s.refundedCount.toLocaleString()}
          subtext={`${refundRate.toFixed(1)}% of volume`}
          trend={{ direction: refundRate > 10 ? 'down' : 'neutral', label: `${refundRate.toFixed(1)}%` }}
          variant={refundRate > 10 ? 'warning' : 'default'}
        />
        <StatCard
          label="Chargebacks"
          value={s.chargebackCount.toLocaleString()}
          subtext={`${chargebackRate.toFixed(2)}% ratio`}
          trend={{ direction: chargebackRate > 1 ? 'down' : 'neutral', label: `${chargebackRate.toFixed(2)}%` }}
          variant={chargebackRate > 1 ? 'danger' : 'default'}
        />
      </div>

      {/* ── Rate gauges ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <RateGauge
          label="Payment Success Rate"
          rate={successRate}
          description={`${s.capturedCount.toLocaleString()} captured of ${s.totalTransactions.toLocaleString()} total`}
        />
        <RateGauge
          label="Failure Rate"
          rate={failureRate}
          variant={failureRate > 10 ? 'danger' : failureRate > 5 ? 'warning' : 'success'}
          description={`${s.failedCount.toLocaleString()} failed transactions`}
        />
      </div>
    </>
  );
}

async function AlertsSection() {
  const alerts = await fetchRecentAlerts(5);
  return <AlertFeed alerts={alerts} />;
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-gray-500">Payments operations overview</p>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          Live
        </span>
      </div>

      {/* ── KPI + Gauges ────────────────────────────────────────────────── */}
      <Suspense fallback={
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <RateGaugeSkeleton /><RateGaugeSkeleton />
          </div>
        </>
      }>
        <StatsSection />
      </Suspense>

      {/* ── Alerts ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-700">Recent Alerts</h2>
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
            Active
          </span>
        </div>
        <div className="px-5 pb-2">
          <Suspense fallback={<AlertFeedSkeleton rows={5} />}>
            <AlertsSection />
          </Suspense>
        </div>
      </div>

      {/* ── Status breakdown table ───────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-700">Transaction Status Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Count</th>
                <th className="px-5 py-3 text-right">Share</th>
                <th className="px-5 py-3">Distribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { status: 'CAPTURED',    count: MOCK_STATS.capturedCount,    colour: 'bg-emerald-500' },
                { status: 'AUTHORIZED',  count: 1_500,                        colour: 'bg-blue-400'    },
                { status: 'REFUNDED',    count: MOCK_STATS.refundedCount,     colour: 'bg-amber-400'   },
                { status: 'FAILED',      count: MOCK_STATS.failedCount,       colour: 'bg-red-400'     },
                { status: 'CHARGEBACK',  count: MOCK_STATS.chargebackCount,   colour: 'bg-red-600'     },
              ].map(({ status, count, colour }) => {
                const pct = ((count / MOCK_STATS.totalTransactions) * 100).toFixed(1);
                return (
                  <tr key={status} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs font-medium text-gray-700">{status}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-gray-800">
                      {count.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-500">{pct}%</td>
                    <td className="px-5 py-3">
                      <div className="h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-gray-100">
                        <div className={`h-1.5 rounded-full ${colour}`} style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
