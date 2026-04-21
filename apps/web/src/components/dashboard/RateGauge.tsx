import { cn } from '@/lib/cn';

interface RateGaugeProps {
  label: string;
  rate: number; // 0–100
  variant?: 'success' | 'warning' | 'danger';
  description?: string;
}

function resolveVariant(rate: number, explicit?: RateGaugeProps['variant']) {
  if (explicit) return explicit;
  if (rate >= 95) return 'success';
  if (rate >= 80) return 'warning';
  return 'danger';
}

const trackColour = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-400',
  danger:  'bg-red-500',
};

const textColour = {
  success: 'text-emerald-600',
  warning: 'text-amber-600',
  danger:  'text-red-500',
};

export function RateGauge({ label, rate, variant, description }: RateGaugeProps) {
  const v   = resolveVariant(rate, variant);
  const pct = Math.min(Math.max(rate, 0), 100);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
        <span className={cn('text-2xl font-bold', textColour[v])}>{pct.toFixed(1)}%</span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={cn('h-2 rounded-full transition-all duration-500', trackColour[v])}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {description && <p className="mt-2 text-xs text-gray-400">{description}</p>}
    </div>
  );
}
