import type { Auth } from '@motusfit/auth';
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
