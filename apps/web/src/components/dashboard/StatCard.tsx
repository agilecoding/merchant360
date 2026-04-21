import { cn } from '@/lib/cn';

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  trend?: { direction: 'up' | 'down' | 'neutral'; label: string };
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const variantBar: Record<NonNullable<StatCardProps['variant']>, string> = {
  default: 'bg-brand-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-400',
  danger:  'bg-red-500',
};

const trendColour = {
  up:      'text-emerald-600',
  down:    'text-red-500',
  neutral: 'text-gray-400',
};

const trendArrow = { up: '↑', down: '↓', neutral: '–' };

export function StatCard({ label, value, subtext, trend, variant = 'default' }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* coloured top bar */}
      <div className={cn('absolute inset-x-0 top-0 h-1', variantBar[variant])} />
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
      <div className="mt-1.5 flex items-center gap-2">
        {trend && (
          <span className={cn('text-xs font-semibold', trendColour[trend.direction])}>
            {trendArrow[trend.direction]} {trend.label}
          </span>
        )}
        {subtext && <span className="text-xs text-gray-400">{subtext}</span>}
      </div>
    </div>
  );
}
