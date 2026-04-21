import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import type { RecentAlert } from '@/lib/dashboard';

const severityStyles: Record<RecentAlert['severity'], { dot: string; bg: string; label: string }> = {
  critical: { dot: 'bg-red-500',    bg: 'bg-red-50',    label: 'Critical' },
  warning:  { dot: 'bg-amber-400',  bg: 'bg-amber-50',  label: 'Warning'  },
  info:     { dot: 'bg-blue-400',   bg: 'bg-blue-50',   label: 'Info'     },
};

const typeLabels: Record<RecentAlert['type'], string> = {
  chargeback:    'Chargeback',
  refund_spike:  'Refund Spike',
  high_failure:  'High Failure',
  suspicious:    'Suspicious Activity',
};

interface AlertFeedProps {
  alerts: RecentAlert[];
}

export function AlertFeed({ alerts }: AlertFeedProps) {
  if (alerts.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-gray-400">
        No active alerts
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {alerts.map((alert) => {
        const sty = severityStyles[alert.severity];
        return (
          <li key={alert.id} className="flex items-start gap-3 py-3">
            <span className={cn('mt-1.5 h-2 w-2 flex-shrink-0 rounded-full', sty.dot)} aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium', sty.bg,
                  alert.severity === 'critical' ? 'text-red-700'
                  : alert.severity === 'warning' ? 'text-amber-700'
                  : 'text-blue-700')}>
                  {typeLabels[alert.type]}
                </span>
                <span className="text-xs text-gray-400">{alert.merchantName}</span>
              </div>
              <p className="mt-0.5 text-sm text-gray-700">{alert.message}</p>
              <p className="mt-0.5 text-xs text-gray-400">{formatDate(alert.createdAt)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
