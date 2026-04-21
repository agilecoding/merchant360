import { z } from 'zod';

const STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const;

export const CreateMerchantSchema = z.object({
  name:     z.string().min(1).max(200),
  email:    z.string().email(),
  country:  z.string().length(2).toUpperCase(),
  currency: z.string().length(3).toUpperCase(),
  status:   z.enum(STATUSES).default('ACTIVE'),
});

export const UpdateMerchantSchema = z.object({
  name:   z.string().min(1).max(200).optional(),
  email:  z.string().email().optional(),
  status: z.enum(STATUSES).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });

export const ListQuerySchema = z.object({
  status:   z.enum(STATUSES).optional(),
  country:  z.string().length(2).toUpperCase().optional(),
  page:     z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
});

export type CreateMerchantInput = z.infer<typeof CreateMerchantSchema>;
export type UpdateMerchantInput = z.infer<typeof UpdateMerchantSchema>;
export type ListQuery           = z.infer<typeof ListQuerySchema>;
