import { headers } from 'next/headers';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { ToastContainer } from '@/components/ui/Toast';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const role = (await headers()).get('x-user-role') ?? '';
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar isAdmin={role === 'admin'} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <ToastContainer />
    </div>
  );
}
