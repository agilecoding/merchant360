import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/callback',
  '/api/auth/logout',
  '/api/health',
];

const SESSION_COOKIE = 'm360_session';

/** Decrypt only the small user cookie — pure Web Crypto, Edge-runtime safe */
async function verifySession(token: string): Promise<{ role: string; expiresAt: number } | null> {
  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) return null;

    // Must match session.ts: padEnd(32, '0').slice(0, 32)
    const padded32 = secret.padEnd(32, '0').slice(0, 32);
    const enc      = new TextEncoder();
    const keyBytes = enc.encode(padded32);

    const key = await crypto.subtle.importKey(
      'raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt'],
    );

    // base64url → Uint8Array without Buffer
    const b64    = token.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '=='.slice(0, (4 - b64.length % 4) % 4);
    const bytes  = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));

    const iv    = bytes.subarray(0, 12);
    const ct    = bytes.subarray(12);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    const data  = JSON.parse(new TextDecoder().decode(plain)) as {
      role: string; expiresAt: number;
    };
    return { role: data.role, expiresAt: data.expiresAt };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token) return redirectToLogin(request, pathname);

  const session = await verifySession(token);
  if (!session) return redirectToLogin(request, pathname);

  // Admin-only guard
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (session.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
  }

  const response = NextResponse.next();
  response.headers.set('x-user-role', session.role);
  return response;
}

function redirectToLogin(req: NextRequest, callbackPath: string): NextResponse {
  const appBase     = process.env.NEXTAUTH_URL ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const loginUrl    = new URL('/login', appBase);
  const destination = callbackPath === '/' ? '/dashboard' : callbackPath;
  loginUrl.searchParams.set('callbackUrl', destination);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
