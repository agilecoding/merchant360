import { z } from 'zod';

const ConfigSchema = z.object({
  PORT:        z.coerce.number().int().min(1).default(3003),
  MONGODB_URI: z.string().url().default('mongodb://localhost:27017'),
  MONGODB_DB:  z.string().default('merchant360'),
  LOG_LEVEL:   z.enum(['fatal','error','warn','info','debug','trace']).default('info'),
});

const parsed = ConfigSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment:', parsed.error.flatten());
  process.exit(1);
}

export const config = parsed.data;
