import path from 'node:path';
import { config } from 'dotenv';
import { z } from 'zod';

// npm workspace scripts run with cwd = server/, but the shared .env lives at the repo root.
config({ path: path.resolve(process.cwd(), '../.env') });
config(); // also allow a server/.env override if present

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(4000),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRY: z.string().default('7d')
});

export const env = envSchema.parse(process.env);
