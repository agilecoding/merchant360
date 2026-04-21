import { UserMenu } from '@/components/auth/UserMenu';

export function TopBar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div />
      <UserMenu />
    </header>
  );
}
