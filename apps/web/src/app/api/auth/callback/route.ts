import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { exchangeCode, decodeIdToken } from '@/lib/keycloak';
import { deriveRole } from '@/lib/session';
import { decodeState } from '@/lib/pkce-store';
import type { TokenSet } from '@/lib/keycloak';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SESSION_COOKIE     = 'm360_session';
const SESSION_TOK_COOKIE = 'm360_session_tok';
const MAX_AGE            = 60 * 60 * 8; // 8 h

const appBase = () => process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

function loginRedirect(error: string, detail?: string): NextResponse {
  const url = new URL('/login', appBase());
  url.searchParams.set('error', error);
  if (detail && process.env.NODE_ENV !== 'production') url.searchParams.set('detail', detail);
  return NextResponse.redirect(url);
}

async function getKey(): Promise<CryptoKey> {
  const secret  = process.env.NEXTAUTH_SECRET ?? '';
  const raw     = new TextEncoder().encode(secret.padEnd(32, '0').slice(0, 32));
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt']);
}

async function encrypt(data: unknown): Promise<string> {
  const key        = await getKey();
  const iv         = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(data)),
  );
  const buf = new Uint8Array(12 + ciphertext.byteLength);
  buf.set(iv, 0);
  buf.set(new Uint8Array(ciphertext), 12);
  return Buffer.from(buf).toString('base64url');
}

function cookieString(name: string, value: string, isSecure: boolean): string {
  const expires = new Date(Date.now() + MAX_AGE * 1000).toUTCString();
  let s = `${name}=${value}; Path=/; Expires=${expires}; Max-Age=${MAX_AGE}; HttpOnly; SameSite=Lax`;
  if (isSecure) s += '; Secure';
  return s;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) return loginRedirect(error);
  if (!code || !state) return loginRedirect('invalid_state', 'Missing code or state');

  const pkce = decodeState(state);
  if (!pkce) return loginRedirect('invalid_state', 'Could not decode state');

  const { codeVerifier, callbackUrl } = pkce;

  try {
    const tokens   = await exchangeCode(code, codeVerifier);
    const userInfo = decodeIdToken(tokens.idToken);

    // Small payload — only what middleware needs
    const userPayload = {
      id:        userInfo.sub,
      email:     userInfo.email,
      role:      deriveRole(userInfo),
      expiresAt: tokens.expiresAt,
    };

    const [sessionVal, tokenVal] = await Promise.all([
      encrypt(userPayload),
      encrypt(tokens as unknown as Record<string, unknown>),
    ]);

    const isSecure = process.env.NODE_ENV === 'production' &&
                     (process.env.NEXTAUTH_URL ?? '').startsWith('https');

    const destination = callbackUrl.startsWith('http')
      ? callbackUrl
      : new URL(callbackUrl, appBase()).toString();

    const response = NextResponse.redirect(destination);
    // Set cookies explicitly on the response — avoids next/headers cache issues
    response.headers.append('Set-Cookie', cookieString(SESSION_COOKIE,     sessionVal, isSecure));
    response.headers.append('Set-Cookie', cookieString(SESSION_TOK_COOKIE, tokenVal,   isSecure));
    return response;

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[auth/callback] token exchange failed:', message);
    return loginRedirect('auth_failed', message);
  }
}
