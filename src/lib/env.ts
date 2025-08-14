import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1).optional(),
  POSTGRES_URL: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
});

function validateEnv() {
  try {
    envSchema.parse(process.env);
    return true;
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    return false;
  }
}

export { validateEnv };