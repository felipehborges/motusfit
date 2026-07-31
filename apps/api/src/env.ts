import { z } from 'zod';

// Validação de env no bootstrap (docs/security.md): a API não sobe com env inválida.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().url().optional(),
  BETTER_AUTH_SECRET: z.string().min(16),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3001'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((value) => value.split(',').map((origin) => origin.trim())),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  // Render (e outros PaaS) injetam PORT; tem prioridade sobre API_PORT quando presente.
  const merged = source.PORT ? { ...source, API_PORT: source.PORT } : source;
  const result = envSchema.safeParse(merged);
  if (!result.success) {
    throw new Error(`Variáveis de ambiente inválidas:\n${result.error.message}`);
  }
  return result.data;
}
