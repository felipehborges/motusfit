import { describe, expect, it } from 'vitest';
import { createApp } from './app';
import { loadEnv } from './env';

const app = createApp(loadEnv({ NODE_ENV: 'test' }));

describe('GET /api/v1/health', () => {
  it('responde ok', async () => {
    const res = await app.request('/api/v1/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok', version: '0.0.0' });
  });
});

describe('loadEnv', () => {
  it('rejeita env inválida', () => {
    expect(() => loadEnv({ API_PORT: 'abc' })).toThrow(/inválidas/);
  });
});
