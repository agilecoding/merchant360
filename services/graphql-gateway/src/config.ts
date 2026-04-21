import { z } from 'zod';

const ConfigSchema = z.object({
  PORT:                     z.coerce.number().int().min(1).default(4000),
  PAYMENT_SERVICE_URL:      z.string().url().default('http://localhost:3001'),
  REFUND_SERVICE_URL:       z.string().url().default('http://localhost:3002'),
  MERCHANT_SERVICE_URL:     z.string().url().default('http://localhost:3003'),
  NOTIFICATION_SERVICE_URL: z.string().url().default('http://localhost:3004'),
  LOG_LEVEL:                z.enum(['fatal','error','warn','info','debug','trace']).default('info'),
});

const parsed = ConfigSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment:', parsed.error.flatten());
  process.exit(1);
}

export const config = parsed.data;
