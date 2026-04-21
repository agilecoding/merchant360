import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { fetchAdminUsers, fetchAdminMerchants } from '@/lib/admin';
import { UsersTable } from '@/components/admin/UsersTable';
import { MerchantsTable } from '@/components/admin/MerchantsTable';

async function AdminContent() {
  const [users, merchants] = await Promise.all([
    fetchAdminUsers(),
    fetchAdminMerchants(),
  ]);

  return (
    <div className="space-y-10">
      {/* Users */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Users</h2>
            <p className="text-sm text-gray-500">{users.length} total</p>
          </div>
        </div>
        <UsersTable users={users} />
      </section>

      {/* Merchants */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Merchants</h2>
            <p className="text-sm text-gray-500">{merchants.length} total</p>
          </div>
        </div>
        <MerchantsTable merchants={merchants} />
      </section>
    </div>
  );
}

export default async function AdminPage() {
  const role = (await headers()).get('x-user-role');
  if (role !== 'admin') redirect('/dashboard');

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Admin</h1>
        <p className="text-sm text-gray-500">Manage users, roles, and merchant accounts.</p>
      </div>
      <Suspense fallback={<AdminSkeleton />}>
        <AdminContent />
      </Suspense>
    </div>
  );
}

function AdminSkeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      {[0, 1].map((i) => (
        <div key={i} className="space-y-3">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-48 rounded-lg bg-gray-100" />
        </div>
      ))}
    </div>
  );
}
