import { z } from 'zod';

const ConfigSchema = z.object({
  PORT:               z.coerce.number().int().min(1).default(3004),
  LOG_LEVEL:          z.enum(['fatal','error','warn','info','debug','trace']).default('info'),
  WEBHOOK_TIMEOUT_MS: z.coerce.number().int().min(100).default(5000),
});

const parsed = ConfigSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment:', parsed.error.flatten());
  process.exit(1);
}

export const config = parsed.data;
