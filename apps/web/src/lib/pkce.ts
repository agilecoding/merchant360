/** PKCE (RFC 7636) utilities — Web Crypto API, runs in Node.js / Edge */

export function generateState(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64url');
}

export function generateCodeVerifier(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url');
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data    = new TextEncoder().encode(verifier);
  const digest  = await crypto.subtle.digest('SHA-256', data);
  return Buffer.from(digest).toString('base64url');
}
