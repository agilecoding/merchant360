import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { buildLogoutUrl } from '@/lib/keycloak';
import { getSession, clearSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const appBase = () => process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

export async function POST(_req: NextRequest) {
  const session = await getSession();
  await clearSession();

  const postLogout = new URL('/login', appBase()).toString();

  if (session?.tokens.idToken) {
    const logoutUrl = buildLogoutUrl(session.tokens.idToken, postLogout);
    return NextResponse.redirect(logoutUrl);
  }

  return NextResponse.redirect(postLogout);
}
