import { type Auth, getUserPlan } from '@motusfit/auth';
import type { Database } from '@motusfit/db';
import { ORPCError, os } from '@orpc/server';

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

/** Contexto injetado em todo procedimento oRPC. */
export type AppContext = {
  db: Database;
  auth: Auth;
  user: SessionUser | null;
};

export const base = os.$context<AppContext>();

/** Procedimentos são autenticados por padrão (docs/security.md). */
export const requireAuth = base.middleware(({ context, next }) => {
  if (!context.user) {
    throw new ORPCError('UNAUTHORIZED');
  }
  return next({ context: { ...context, user: context.user } });
});

/**
 * Gating de features premium (ADR 0008 / docs/roadmap.md 7.2). Já inclui
 * `requireAuth` — basta `.use(requirePremium)`. A primeira feature a usar
 * isto entra na Fase 7.3, quando definida.
 */
export const requirePremium = requireAuth.concat(async ({ context, next }) => {
  const plan = await getUserPlan(context.db, context.user.id);
  if (plan !== 'premium') {
    throw new ORPCError('FORBIDDEN', { message: 'Recurso exclusivo do plano premium' });
  }
  return next({ context });
});
