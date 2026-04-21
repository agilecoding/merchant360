import { z } from 'zod';

export const CreateRefundSchema = z.object({
  transactionId:  z.string().min(1),
  amount:         z.number().int().positive(),
  currency:       z.string().length(3).toUpperCase(),
  reason:         z.string().max(500).optional(),
});

export type CreateRefundInput = z.infer<typeof CreateRefundSchema>;
