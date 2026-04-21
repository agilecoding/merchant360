import { z } from 'zod';

export const TRANSACTION_STATUSES = [
  'AUTHORIZED', 'CAPTURED', 'FAILED', 'PENDING', 'REFUNDED', 'CHARGEBACK', 'CANCELLED',
] as const;

export const ListQuerySchema = z.object({
  merchantId: z.string().optional(),
  status:     z.enum(TRANSACTION_STATUSES).optional(),
  from:       z.string().datetime({ offset: true }).optional(),
  to:         z.string().datetime({ offset: true }).optional(),
  page:       z.coerce.number().int().min(1).default(1),
  pageSize:   z.coerce.number().int().min(1).max(200).default(20),
  sort:       z.enum(['createdAt', 'amount', 'status']).default('createdAt'),
  order:      z.enum(['asc', 'desc']).default('desc'),
});

export type ListQuery = z.infer<typeof ListQuerySchema>;
