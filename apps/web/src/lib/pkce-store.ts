/**
 * Stateless PKCE state encoding.
 *
 * Encodes codeVerifier + callbackUrl directly into the OAuth `state`
 * parameter as base64url JSON — no in-memory store, works across workers/containers.
 *
 * The outer `state` sent to Keycloak = base64url({ nonce, codeVerifier, callbackUrl })
 * On callback, decode the state to recover the verifier.
 */

export interface PkceSession {
  codeVerifier: string;
  callbackUrl:  string;
}

interface StatePayload extends PkceSession {
  nonce: string;
}

export function encodeState(session: PkceSession): string {
  const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(12))).toString('base64url');
  const payload: StatePayload = { nonce, ...session };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export function decodeState(state: string): PkceSession | null {
  try {
    const payload = JSON.parse(Buffer.from(state, 'base64url').toString('utf-8')) as StatePayload;
    if (!payload.codeVerifier || !payload.callbackUrl) return null;
    return { codeVerifier: payload.codeVerifier, callbackUrl: payload.callbackUrl };
  } catch {
    return null;
  }
}

// Legacy no-ops kept for compatibility
export function storePkceSession(_state: string, _session: PkceSession): void {}
export function retrievePkceSession(_state: string): PkceSession | null { return null; }
export function purgeExpiredPkceSessions(): void {}
