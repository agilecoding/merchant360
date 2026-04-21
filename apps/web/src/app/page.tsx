import { redirect } from 'next/navigation';

// Root → redirect to dashboard (auth guard in middleware)
export default function RootPage() {
  redirect('/dashboard');
}
