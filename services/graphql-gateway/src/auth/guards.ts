import { GraphQLError } from 'graphql';
import type { UserRole } from '@merchant360/shared-types';
import type { GatewayContext } from '../context.js';

/**
 * Decoded JWT claims we care about.
 * Keycloak puts roles in realm_access.roles.
 */
interface TokenClaims {
  sub:          string;
  email?:       string;
  realm_access?: { roles: string[] };
  merchant_id?: string;
  exp:          number;
}

const ROLE_ALIASES: Record<string, UserRole> = {
  admin:    'admin',
  analyst:  'analyst',
  merchant: 'merchant',
};

function decodeJwt(token: string): TokenClaims | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json   = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json) as TokenClaims;
  } catch {
    return null;
  }
}

function extractRole(claims: TokenClaims): UserRole | null {
  const roles = claims.realm_access?.roles ?? [];
  for (const alias of Object.keys(ROLE_ALIASES)) {
    if (roles.includes(alias)) return ROLE_ALIASES[alias];
  }
  return null;
}

export interface AuthUser {
  id:         string;
  email:      string;
  role:       UserRole;
  merchantId: string | null;
}

/**
 * Resolve the caller's identity from the JWT in context.
 * Returns null when no token is present (unauthenticated).
 * Throws UNAUTHENTICATED when token is expired or malformed.
 */
export function resolveUser(ctx: GatewayContext): AuthUser | null {
  if (!ctx.authToken) return null;

  const claims = decodeJwt(ctx.authToken);
  if (!claims) {
    throw new GraphQLError('Invalid token', {
      extensions: { code: 'UNAUTHENTICATED', http: { status: 401 } },
    });
  }

  if (claims.exp < Math.floor(Date.now() / 1000)) {
    throw new GraphQLError('Token expired', {
      extensions: { code: 'UNAUTHENTICATED', http: { status: 401 } },
    });
  }

  const role = extractRole(claims);
  if (!role) {
    throw new GraphQLError('No recognised role in token', {
      extensions: { code: 'FORBIDDEN', http: { status: 403 } },
    });
  }

  return {
    id:         claims.sub,
    email:      claims.email ?? '',
    role,
    merchantId: claims.merchant_id ?? null,
  };
}

/** Require authentication — throws UNAUTHENTICATED if no valid token. */
export function requireAuth(ctx: GatewayContext): AuthUser {
  const user = resolveUser(ctx);
  if (!user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED', http: { status: 401 } },
    });
  }
  return user;
}

/** Require one of the listed roles — throws FORBIDDEN otherwise. */
export function requireRole(ctx: GatewayContext, ...roles: UserRole[]): AuthUser {
  const user = requireAuth(ctx);
  if (!roles.includes(user.role)) {
    throw new GraphQLError(
      `Requires role: ${roles.join(' or ')}. Got: ${user.role}`,
      { extensions: { code: 'FORBIDDEN', http: { status: 403 } } },
    );
  }
  return user;
}

/**
 * Merchant-scoped guard: merchants can only see their own data.
 * Admins and analysts see all.
 */
export function requireMerchantScope(
  ctx: GatewayContext,
  filter: Record<string, unknown>,
): { user: AuthUser; scopedFilter: Record<string, unknown> } {
  const user = requireAuth(ctx);

  if (user.role === 'merchant') {
    if (!user.merchantId) {
      throw new GraphQLError('Merchant account not linked', {
        extensions: { code: 'FORBIDDEN', http: { status: 403 } },
      });
    }
    // Enforce merchantId — merchant cannot query another merchant's data
    return { user, scopedFilter: { ...filter, merchantId: user.merchantId } };
  }

  // admin / analyst: pass filter through unmodified
  return { user, scopedFilter: filter };
}
