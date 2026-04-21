import { z } from 'zod';

export const NOTIFICATION_EVENTS = [
  'refund.created',
  'refund.processed',
  'refund.failed',
  'transaction.captured',
  'transaction.chargeback',
  'merchant.status_changed',
] as const;

export const SendEmailSchema = z.object({
  event:   z.enum(NOTIFICATION_EVENTS),
  to:      z.string().email(),
  subject: z.string().min(1).max(200),
  body:    z.string().min(1).max(10_000),
});

export type SendEmailInput = z.infer<typeof SendEmailSchema>;
