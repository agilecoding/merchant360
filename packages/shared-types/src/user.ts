export type UserRole = 'admin' | 'analyst' | 'merchant';

export const USER_ROLES: readonly UserRole[] = ['admin', 'analyst', 'merchant'] as const;

/** Role permission matrix */
export const ROLE_PERMISSIONS: Record<UserRole, readonly string[]> = {
  admin: ['transactions:read', 'transactions:write', 'refunds:read', 'refunds:write', 'merchants:read', 'merchants:write'],
  analyst: ['transactions:read', 'refunds:read', 'merchants:read'],
  merchant: ['transactions:read', 'refunds:read', 'refunds:write'],
} as const;

export interface User {
  id: string;
  email: string;
  role: UserRole;
  /** Populated only when role === 'merchant' */
  merchantId?: string;
}

export interface AuthContext {
  user: User;
  token: string;
  expiresAt: number;
}
