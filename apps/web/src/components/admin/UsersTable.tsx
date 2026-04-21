'use client';

import { useState, useTransition } from 'react';
import { toast } from '@/components/ui/Toast';
import type { User, UserRole } from '@/lib/admin';

const ROLES: UserRole[] = ['admin', 'analyst', 'merchant'];

const roleBadge: Record<UserRole, string> = {
  admin:    'bg-purple-100 text-purple-700',
  analyst:  'bg-blue-100   text-blue-700',
  merchant: 'bg-green-100  text-green-700',
};

interface Props { users: User[] }

export function UsersTable({ users }: Props) {
  const [rows, setRows]     = useState(users);
  const [pending, startTransition] = useTransition();

  async function handleRoleChange(id: string, role: UserRole) {
    const prev = rows.find((u) => u.id === id)?.role;
    setRows((r) => r.map((u) => u.id === id ? { ...u, role } : u));

    startTransition(async () => {
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        setRows((r) => r.map((u) => u.id === id ? { ...u, role: prev! } : u));
        toast('error', 'Update failed', 'Could not update user role.');
      } else {
        toast('success', 'Role updated', `User role set to ${role}.`);
      }
    });
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
          <tr>
            {['ID', 'Email', 'Merchant ID', 'Role'].map((h) => (
              <th key={h} className="px-4 py-3 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {rows.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-xs text-gray-400">{user.id}</td>
              <td className="px-4 py-3 text-gray-900">{user.email}</td>
              <td className="px-4 py-3 font-mono text-xs text-gray-400">
                {user.merchantId ?? <span className="text-gray-300">—</span>}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${roleBadge[user.role]}`}>
                    {user.role}
                  </span>
                  <select
                    value={user.role}
                    disabled={pending}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                    className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
                    aria-label={`Change role for ${user.email}`}
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
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
