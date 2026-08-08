import { z } from 'zod';

// Validação de env no bootstrap (docs/security.md): a API não sobe com env inválida.
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    API_PORT: z.coerce.number().int().positive().default(3001),
    DATABASE_URL: z.string().url().optional(),
    BETTER_AUTH_SECRET: z.string().min(16),
    BETTER_AUTH_URL: z.string().url().default('http://localhost:3001'),
    CORS_ORIGINS: z
      .string()
      .default('http://localhost:3000')
      .transform((value) => value.split(',').map((origin) => origin.trim())),
    // Billing (ADR 0008): opt-in — ausente/false, app roda com todo mundo em plano free
    BILLING_ENABLED: z
      .string()
      .default('false')
      .transform((v) => v === 'true'),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_PREMIUM_MONTHLY_PRICE_ID: z.string().optional(),
  })
  .refine(
    (env) =>
      !env.BILLING_ENABLED ||
      (env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET && env.STRIPE_PREMIUM_MONTHLY_PRICE_ID),
    {
      message:
        'BILLING_ENABLED=true exige STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET e STRIPE_PREMIUM_MONTHLY_PRICE_ID',
    },
  );

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Variáveis de ambiente inválidas:\n${result.error.message}`);
  }
  return result.data;
}
