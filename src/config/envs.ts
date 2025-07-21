import 'dotenv/config';
import { z } from 'zod';

const envSchema = z
  .object({
    PORT: z.coerce.number(),
    DATABASE_URL: z.string(),
    NATS_SERVICE: z.array(z.string()),
  })
  .passthrough();

const { success, error, data } = envSchema.safeParse({
  ...process.env,
  NATS_SERVICE: process.env.NATS_SERVICE?.split(','),
});
if (!success) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const envs = {
  PORT: data.PORT,
  DATABASE_URL: data.DATABASE_URL,
  NATS_SERVICE: data.NATS_SERVICE,
};
