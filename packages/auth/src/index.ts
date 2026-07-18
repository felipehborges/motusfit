import type { Database } from '@motusfit/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

export type CreateAuthOptions = {
  db: Database;
  secret: string;
  baseUrl: string;
  trustedOrigins: string[];
};

/**
 * Instância Better Auth (ADR 0004). Rotas montadas na API em /api/auth/*.
 * E-mail+senha no MVP; OAuth/2FA/passkeys entram via plugins depois.
 */
export function createAuth(options: CreateAuthOptions) {
  return betterAuth({
    database: drizzleAdapter(options.db, { provider: 'pg', usePlural: true }),
    secret: options.secret,
    baseURL: options.baseUrl,
    trustedOrigins: options.trustedOrigins,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth['$Infer']['Session'];
