import { serve } from '@hono/node-server';
import { createAuth } from '@motusfit/auth';
import { applyMigrations, createDatabase } from '@motusfit/db';
import { pino } from 'pino';
import { createApp } from './app';
import { loadEnv } from './env';

const logger = pino({ name: 'api' });
const env = loadEnv();

const db = createDatabase({ databaseUrl: env.DATABASE_URL });
await applyMigrations(db);

const auth = createAuth({
  db,
  secret: env.BETTER_AUTH_SECRET,
  baseUrl: env.BETTER_AUTH_URL,
  trustedOrigins: env.CORS_ORIGINS,
});

const app = createApp({ env, db, auth });

serve({ fetch: app.fetch, port: env.API_PORT }, (info) => {
  logger.info({ port: info.port }, 'API no ar');
});
