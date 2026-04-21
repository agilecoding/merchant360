import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Returns the current session user — used by client components */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json(null, { status: 401 });
  // Return user only — never tokens
  return NextResponse.json({ user: session.user });
}
