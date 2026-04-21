/**
 * Encrypted server-side session.
 *
 * Two-cookie strategy to keep the middleware cookie small:
 *   m360_session      — user identity only (~200 bytes) — read by middleware + API routes
 *   m360_session_tok  — encrypted TokenSet — read only by API routes that need tokens
 */
import { cookies } from 'next/headers';
import type { TokenSet, KeycloakUserInfo } from './keycloak.js';
import type { UserRole } from '@merchant360/shared-types';

export const SESSION_COOKIE     = 'm360_session';
export const SESSION_TOK_COOKIE = 'm360_session_tok';
const MAX_AGE_SECONDS           = 60 * 60 * 8; // 8 h

export interface UserPayload {
  id:          string;
  email:       string;
  role:        UserRole;
  merchantId?: string;
  expiresAt:   number; // token expiry unix seconds
}

export interface SessionData {
  user:   UserPayload;
  tokens: TokenSet;
}

function getSecret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error('NEXTAUTH_SECRET is not set');
  return s;
}

async function getKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const raw = enc.encode(secret.padEnd(32, '0').slice(0, 32));
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function encrypt(data: unknown): Promise<string> {
  const key        = await getKey(getSecret());
  const iv         = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(data)),
  );
  const buf = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  buf.set(iv, 0);
  buf.set(new Uint8Array(ciphertext), iv.byteLength);
  return Buffer.from(buf).toString('base64url');
}

async function decrypt<T>(token: string): Promise<T | null> {
  try {
    const key   = await getKey(getSecret());
    const buf   = Buffer.from(token, 'base64url');
    const iv    = buf.subarray(0, 12);
    const ct    = buf.subarray(12);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return JSON.parse(new TextDecoder().decode(plain)) as T;
  } catch {
    return null;
  }
}

export function deriveRole(userInfo: KeycloakUserInfo): UserRole {
  const roles = userInfo.realm_access?.roles ?? [];
  if (roles.includes('admin'))   return 'admin';
  if (roles.includes('analyst')) return 'analyst';
  return 'merchant';
}

const cookieOpts = (maxAge = MAX_AGE_SECONDS) => ({
  httpOnly: true,
  sameSite: 'lax'  as const,
  path:     '/',
  maxAge,
  secure: process.env.NODE_ENV === 'production' && process.env.NEXTAUTH_URL?.startsWith('https'),
});

/** Set both session cookies */
export async function setSession(data: SessionData): Promise<void> {
  const jar = await cookies();

  const userPayload: UserPayload = {
    id:         data.user.id,
    email:      data.user.email,
    role:       data.user.role,
    merchantId: data.user.merchantId,
    expiresAt:  data.tokens.expiresAt,
  };

  // Small cookie — middleware reads this
  jar.set(SESSION_COOKIE, await encrypt(userPayload), cookieOpts());
  // Large cookie — only API routes read this when they need tokens
  jar.set(SESSION_TOK_COOKIE, await encrypt(data.tokens), cookieOpts());
}

/** Read user payload from small session cookie */
export async function getSession(): Promise<SessionData | null> {
  const jar      = await cookies();
  const userCookie = jar.get(SESSION_COOKIE)?.value;
  const tokCookie  = jar.get(SESSION_TOK_COOKIE)?.value;
  if (!userCookie || !tokCookie) return null;

  const user   = await decrypt<UserPayload>(userCookie);
  const tokens = await decrypt<TokenSet>(tokCookie);
  if (!user || !tokens) return null;

  return { user, tokens };
}

/** Used by middleware — decrypts only the small user cookie (no Buffer, no next/headers) */
export async function decryptSession(token: string): Promise<UserPayload | null> {
  return decrypt<UserPayload>(token);
}

/** Delete both session cookies */
export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(SESSION_TOK_COOKIE);
}
