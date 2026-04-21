'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/cn';

interface SortableHeaderProps {
  field: string;
  label: string;
  className?: string;
}

export function SortableHeader({ field, label, className }: SortableHeaderProps) {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  const currentField = searchParams.get('sortField') ?? 'createdAt';
  const currentDir   = searchParams.get('sortDir')   ?? 'desc';
  const active       = currentField === field;
  const nextDir      = active && currentDir === 'desc' ? 'asc' : 'desc';

  function toggle() {
    const p = new URLSearchParams(searchParams.toString());
    p.set('sortField', field);
    p.set('sortDir', nextDir);
    p.set('page', '1');
    router.push(`${pathname}?${p}` as any);
  }

  return (
    <th
      onClick={toggle}
      className={cn(
        'cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600',
        className,
      )}
    >
      <span className="flex items-center gap-1">
        {label}
        {active ? (
          <span className="text-brand-500">{currentDir === 'desc' ? '↓' : '↑'}</span>
        ) : (
          <span className="text-gray-200">↕</span>
        )}
      </span>
    </th>
  )
}
