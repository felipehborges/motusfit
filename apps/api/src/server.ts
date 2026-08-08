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
  // ADR 0008: billing é opt-in — sem as três env vars, ninguém vira premium.
  billing:
    env.BILLING_ENABLED &&
    env.STRIPE_SECRET_KEY &&
    env.STRIPE_WEBHOOK_SECRET &&
    env.STRIPE_PREMIUM_MONTHLY_PRICE_ID
      ? {
          secretKey: env.STRIPE_SECRET_KEY,
          webhookSecret: env.STRIPE_WEBHOOK_SECRET,
          premiumMonthlyPriceId: env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
        }
      : undefined,
});

const app = createApp({ env, db, auth });

serve({ fetch: app.fetch, port: env.API_PORT }, (info) => {
  logger.info({ port: info.port }, 'API no ar');
});
