import type { Auth } from '@motusfit/auth';
import { type Database, schema } from '@motusfit/db';
import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { ZodSmartCoercionPlugin } from '@orpc/zod';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './env';
import { router } from './router';

const openApiHandler = new OpenAPIHandler(router, {
  plugins: [new ZodSmartCoercionPlugin()],
});

export type AppDeps = {
  env: Env;
  db: Database;
  auth: Auth;
};

const localDemoUser = {
  id: 'local-demo-user',
  email: 'local-demo@motusfit.test',
  name: 'Atleta local',
};

async function currentUser({ auth, db, env, request }: AppDeps & { request: Request }) {
  if (!env.authEnabled) {
    await db.insert(schema.users).values(localDemoUser).onConflictDoNothing();
    return localDemoUser;
  }

  const session = await auth.api.getSession({ headers: request.headers });
  return session
    ? { id: session.user.id, email: session.user.email, name: session.user.name }
    : null;
}

/** Monta o app Hono (separado do listen para testes de integração). */
export function createApp({ env, db, auth }: AppDeps): Hono {
  const app = new Hono();

  app.use(
    '/api/*',
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
    }),
  );

  if (env.authEnabled) {
    // Better Auth (ADR 0004): signup/login/logout/sessão
    app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));
  }

  app.use('/api/v1/*', async (c, next) => {
    const user = await currentUser({ auth, db, env, request: c.req.raw });
    const { matched, response } = await openApiHandler.handle(c.req.raw, {
      prefix: '/api/v1',
      context: {
        db,
        auth,
        user,
      },
    });
    if (matched) {
      return c.newResponse(response.body, response);
    }
    await next();
  });

  return app;
}
