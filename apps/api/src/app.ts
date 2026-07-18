import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { ZodSmartCoercionPlugin } from '@orpc/zod';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './env';
import { router } from './router';

const openApiHandler = new OpenAPIHandler(router, {
  plugins: [new ZodSmartCoercionPlugin()],
});

/** Monta o app Hono (separado do listen para testes de integração). */
export function createApp(env: Env): Hono {
  const app = new Hono();

  app.use(
    '/api/*',
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
    }),
  );

  app.use('/api/v1/*', async (c, next) => {
    const { matched, response } = await openApiHandler.handle(c.req.raw, {
      prefix: '/api/v1',
    });
    if (matched) {
      return c.newResponse(response.body, response);
    }
    await next();
  });

  return app;
}
