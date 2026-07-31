import { describe, expect, it } from 'vitest';
import { loadEnv } from './env';

const base = { BETTER_AUTH_SECRET: 'a'.repeat(16) };

describe('loadEnv', () => {
  it('usa API_PORT quando PORT não está presente', () => {
    expect(loadEnv({ ...base, API_PORT: '4000' }).API_PORT).toBe(4000);
  });

  it('PORT (convenção de PaaS como Render) tem prioridade sobre API_PORT', () => {
    expect(loadEnv({ ...base, PORT: '10000', API_PORT: '4000' }).API_PORT).toBe(10000);
  });

  it('rejeita sem BETTER_AUTH_SECRET', () => {
    expect(() => loadEnv({})).toThrow();
  });
});
