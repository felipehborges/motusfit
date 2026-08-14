import { expo } from '@better-auth/expo';
import type { Database } from '@motusfit/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { type BillingOptions, createBillingPlugin } from './billing';

/** Scheme de deep link do app Expo (apps/mobile/app.json). */
export const MOBILE_APP_SCHEME = 'motusfit';

export type CreateAuthOptions = {
  db: Database;
  secret: string;
  baseUrl: string;
  trustedOrigins: string[];
  /** Ausente ⇒ billing desabilitado, todo usuário fica em plano free (ADR 0008). */
  billing?: BillingOptions | undefined;
};

/**
 * Instância Better Auth (ADR 0004). Rotas montadas na API em /api/auth/*.
 * E-mail+senha no MVP; OAuth/2FA/passkeys entram via plugins depois.
 */
export function createAuth(options: CreateAuthOptions) {
  // Web e API em domínios distintos (ex.: Vercel + Render) exigem cookie
  // cross-site: SameSite=None só é aceito pelo navegador com Secure (HTTPS).
  const crossSite = options.baseUrl.startsWith('https://');

  return betterAuth({
    database: drizzleAdapter(options.db, { provider: 'pg', usePlural: true }),
    secret: options.secret,
    baseURL: options.baseUrl,
    trustedOrigins: [...options.trustedOrigins, `${MOBILE_APP_SCHEME}://`],
    plugins: [expo(), ...(options.billing ? [createBillingPlugin(options.billing)] : [])],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    ...(crossSite && {
      advanced: { defaultCookieAttributes: { sameSite: 'none', secure: true } },
    }),
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth['$Infer']['Session'];

export type { BillingOptions } from './billing';
export { PREMIUM_PLAN_NAME } from './billing';
export * from './entitlements';
