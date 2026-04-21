/**
 * Keycloak OAuth2 / OIDC helpers
 * All server-side only — never import in client components.
 */

export interface KeycloakConfig {
  url: string;
  realm: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface TokenSet {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresAt: number; // unix seconds
  scope: string;
}

export interface KeycloakUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  preferred_username: string;
  given_name?: string;
  family_name?: string;
  realm_access?: { roles: string[] };
}

function config(): KeycloakConfig {
  // KEYCLOAK_URL         — server-to-server (may be Docker internal: http://keycloak:8080)
  // KEYCLOAK_PUBLIC_URL  — browser-facing (must be reachable from user's machine, e.g. http://localhost:8080)
  //                        Falls back to KEYCLOAK_URL if not set (works when running outside Docker).
  const url          = process.env.KEYCLOAK_URL;
  const realm        = process.env.KEYCLOAK_REALM;
  const clientId     = process.env.KEYCLOAK_CLIENT_ID;
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;
  const nextAuthUrl  = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

  if (!url || !realm || !clientId || !clientSecret) {
    throw new Error('Missing Keycloak environment variables');
  }

  return {
    url,
    realm,
    clientId,
    clientSecret,
    redirectUri: `${nextAuthUrl}/api/auth/callback`,
  };
}

/** Base URL for server→Keycloak calls (may use Docker hostname) */
function serverBaseUrl(cfg: KeycloakConfig) {
  return `${cfg.url}/realms/${cfg.realm}/protocol/openid-connect`;
}

/** Base URL for browser→Keycloak redirects (must be publicly reachable) */
function publicBaseUrl(cfg: KeycloakConfig) {
  const publicUrl = process.env.KEYCLOAK_PUBLIC_URL ?? cfg.url;
  return `${publicUrl}/realms/${cfg.realm}/protocol/openid-connect`;
}

/** Build the authorization redirect URL (sent to browser — must use public URL) */
export function buildAuthorizationUrl(state: string, codeChallenge: string): string {
  const cfg = config();
  const params = new URLSearchParams({
    client_id:             cfg.clientId,
    redirect_uri:          cfg.redirectUri,
    response_type:         'code',
    scope:                 'openid email profile',
    state,
    code_challenge:        codeChallenge,
    code_challenge_method: 'S256',
  });
  return `${publicBaseUrl(cfg)}/auth?${params}`;
}

/** Exchange authorization code for tokens */
export async function exchangeCode(code: string, codeVerifier: string): Promise<TokenSet> {
  const cfg = config();
  const res = await fetch(`${serverBaseUrl(cfg)}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      client_id:     cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uri:  cfg.redirectUri,
      code,
      code_verifier: codeVerifier,
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }

  const data = await res.json() as {
    access_token: string;
    refresh_token: string;
    id_token: string;
    expires_in: number;
    scope: string;
  };

  return {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    idToken:      data.id_token,
    expiresAt:    Math.floor(Date.now() / 1000) + data.expires_in,
    scope:        data.scope,
  };
}

/** Refresh an expired access token */
export async function refreshTokens(refreshToken: string): Promise<TokenSet> {
  const cfg = config();
  const res = await fetch(`${serverBaseUrl(cfg)}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      client_id:     cfg.clientId,
      client_secret: cfg.clientSecret,
      refresh_token: refreshToken,
    }),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);

  const data = await res.json() as {
    access_token: string;
    refresh_token: string;
    id_token: string;
    expires_in: number;
    scope: string;
  };

  return {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    idToken:      data.id_token,
    expiresAt:    Math.floor(Date.now() / 1000) + data.expires_in,
    scope:        data.scope,
  };
}

/** Fetch user info from Keycloak userinfo endpoint */
export async function getUserInfo(accessToken: string): Promise<KeycloakUserInfo> {
  const cfg = config();
  const res = await fetch(`${serverBaseUrl(cfg)}/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`UserInfo failed: ${res.status}`);
  return res.json() as Promise<KeycloakUserInfo>;
}

/**
 * Decode claims from the ID token without verifying signature.
 * Safe for server-side use after a successful code exchange — Keycloak
 * already validated the code, so the id_token is trusted.
 */
export function decodeIdToken(idToken: string): KeycloakUserInfo {
  const payload = idToken.split('.')[1];
  if (!payload) throw new Error('Invalid id_token');
  const json = Buffer.from(payload, 'base64url').toString('utf-8');
  return JSON.parse(json) as KeycloakUserInfo;
}

/** Build Keycloak end-session URL (browser-facing — use public URL) */
export function buildLogoutUrl(idToken: string, postLogoutRedirectUri: string): string {
  const cfg = config();
  const params = new URLSearchParams({
    id_token_hint:            idToken,
    post_logout_redirect_uri: postLogoutRedirectUri,
    client_id:                cfg.clientId,
  });
  return `${publicBaseUrl(cfg)}/logout?${params}`;
}
