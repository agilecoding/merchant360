import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { buildAuthorizationUrl } from '@/lib/keycloak';
import { generateCodeVerifier, generateCodeChallenge } from '@/lib/pkce';
import { encodeState } from '@/lib/pkce-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const callbackUrl  = req.nextUrl.searchParams.get('callbackUrl') ?? '/dashboard';
    const codeVerifier = generateCodeVerifier();
    const challenge    = await generateCodeChallenge(codeVerifier);

    // Encode verifier + callbackUrl into the state param — stateless, works
    // across containers and Next.js worker processes (no in-memory store needed).
    const state   = encodeState({ codeVerifier, callbackUrl });
    const authUrl = buildAuthorizationUrl(state, challenge);

    return NextResponse.redirect(authUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[auth/login] failed to build authorization URL:', message);
    const appBase  = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const loginUrl = new URL('/login', appBase);
    loginUrl.searchParams.set('error', 'auth_failed');
    if (process.env.NODE_ENV !== 'production') loginUrl.searchParams.set('detail', message);
    return NextResponse.redirect(loginUrl);
  }
}
