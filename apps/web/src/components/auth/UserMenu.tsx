'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SessionUser {
  email: string;
  role: string;
}

export function UserMenu() {
  const router  = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => data?.user ? setUser(data.user) : null)
      .catch(() => null);
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login' as any);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      {user && (
        <span className="text-sm text-gray-600">
          {user.email}
          <span className="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
            {user.role}
          </span>
        </span>
      )}
      <button
        onClick={handleLogout}
        className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
      >
        Sign out
      </button>
    </div>
  );
}
