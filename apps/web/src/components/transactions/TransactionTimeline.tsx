import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import type { TimelineEvent } from '@/lib/transaction-detail';
import type { TransactionStatus } from '@merchant360/shared-types';

const dotColour: Record<TransactionStatus, string> = {
  AUTHORIZED: 'bg-blue-400  ring-blue-100',
  CAPTURED:   'bg-emerald-500 ring-emerald-100',
  FAILED:     'bg-red-500   ring-red-100',
  PENDING:    'bg-amber-400 ring-amber-100',
  REFUNDED:   'bg-gray-400  ring-gray-100',
  CHARGEBACK: 'bg-red-700   ring-red-200',
  CANCELLED:  'bg-gray-300  ring-gray-100',
};

interface TransactionTimelineProps {
  events: TimelineEvent[];
}

export function TransactionTimeline({ events }: TransactionTimelineProps) {
  return (
    <ol className="relative space-y-0">
      {events.map((evt, idx) => {
        const isLast = idx === events.length - 1;
        return (
          <li key={evt.id} className="flex gap-4">
            {/* Connector */}
            <div className="flex flex-col items-center">
              <span className={cn(
                'relative z-10 flex h-3 w-3 flex-shrink-0 rounded-full ring-4 mt-1',
                dotColour[evt.status],
              )} />
              {!isLast && <div className="mt-1 w-px flex-1 bg-gray-200" />}
            </div>

            {/* Content */}
            <div className={cn('min-w-0 pb-6', isLast && 'pb-0')}>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-semibold text-gray-800">{evt.label}</span>
                <span className="text-xs text-gray-400">{formatDate(evt.timestamp)}</span>
                {evt.terminal && (
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500">
                    Final
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-gray-500">{evt.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
