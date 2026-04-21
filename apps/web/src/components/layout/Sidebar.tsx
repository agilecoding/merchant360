'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const BASE_NAV = [
  { href: '/dashboard',    label: 'Dashboard'   },
  { href: '/transactions', label: 'Transactions' },
  { href: '/refunds',      label: 'Refunds'      },
  { href: '/merchants',    label: 'Merchants'    },
  { href: '/disputes',     label: 'Disputes'     },
];

const ADMIN_NAV = { href: '/admin', label: 'Admin' };

interface SidebarProps { isAdmin?: boolean }

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname();
  const NAV = isAdmin ? [...BASE_NAV, ADMIN_NAV] : BASE_NAV;

  return (
    <aside className="flex w-60 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <span className="text-lg font-bold text-brand-700">Merchant360</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {NAV.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href as any}
                  className={[
                    'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  ].join(' ')}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  )
}
