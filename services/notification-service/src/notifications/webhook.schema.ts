import { z } from 'zod';
import { NOTIFICATION_EVENTS } from './email.schema.js';

export const SendWebhookSchema = z.object({
  event:  z.enum(NOTIFICATION_EVENTS),
  url:    z.string().url(),
  data:   z.record(z.unknown()),
  secret: z.string().min(1).optional(),
});

export type SendWebhookInput = z.infer<typeof SendWebhookSchema>;
