import { serve } from '@hono/node-server';
import { pino } from 'pino';
import { createApp } from './app';
import { loadEnv } from './env';

const logger = pino({ name: 'api' });
const env = loadEnv();
const app = createApp(env);

serve({ fetch: app.fetch, port: env.API_PORT }, (info) => {
  logger.info({ port: info.port }, 'API no ar');
});
