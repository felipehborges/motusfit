import { createAuth } from '@motusfit/auth';
import { applyMigrations, createDatabase, schema } from '@motusfit/db';
import { eq } from 'drizzle-orm';
import type { Hono } from 'hono';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { loadEnv } from './env';

const env = loadEnv({
  NODE_ENV: 'test',
  BETTER_AUTH_SECRET: 'segredo-de-teste-min-16-chars',
});

let app: Hono;
let db: Awaited<ReturnType<typeof createDatabase>>;

beforeAll(async () => {
  db = createDatabase({ pgliteDataDir: 'memory://' });
  await applyMigrations(db);
  const auth = createAuth({
    db,
    secret: env.BETTER_AUTH_SECRET,
    baseUrl: env.BETTER_AUTH_URL,
    trustedOrigins: env.CORS_ORIGINS,
  });
  app = createApp({ env, db, auth });
});

async function signUp(email: string): Promise<string> {
  const { cookie } = await signUpFull(email);
  return cookie;
}

async function signUpFull(email: string): Promise<{ cookie: string; userId: string }> {
  const res = await app.request('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'senha-segura-123', name: 'Teste' }),
  });
  expect(res.status).toBe(200);
  const cookie = res.headers.get('set-cookie');
  if (!cookie) throw new Error('signup não retornou cookie de sessão');
  const body = (await res.json()) as { user: { id: string } };
  return { cookie, userId: body.user.id };
}

describe('GET /api/v1/health', () => {
  it('responde ok sem autenticação', async () => {
    const res = await app.request('/api/v1/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok', version: '0.0.0' });
  });
});

describe('nutrição em pausa', () => {
  it('desativa as rotas nutricionais por padrão', async () => {
    const res = await app.request('/api/v1/nutrition/foods');
    expect(res.status).toBe(410);
  });
});

describe('auth + perfil', () => {
  it('bloqueia perfil sem sessão', async () => {
    const res = await app.request('/api/v1/identity/profile');
    expect(res.status).toBe(401);
  });

  it('signup cria sessão; perfil começa null, upsert e leitura funcionam', async () => {
    const cookie = await signUp('a@motusfit.test');

    const empty = await app.request('/api/v1/identity/profile', { headers: { cookie } });
    expect(empty.status).toBe(200);
    expect(await empty.json()).toBeNull();

    const upsert = await app.request('/api/v1/identity/profile', {
      method: 'PUT',
      headers: { cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ displayName: 'Felipe', bodyWeightKg: 82.5 }),
    });
    expect(upsert.status).toBe(200);
    const profile = await upsert.json();
    expect(profile).toMatchObject({
      displayName: 'Felipe',
      bodyWeightKg: 82.5,
      timezone: 'America/Sao_Paulo',
      unitSystem: 'metric',
    });
  });

  it('valida entrada via contrato (peso negativo rejeitado)', async () => {
    const cookie = await signUp('b@motusfit.test');
    const res = await app.request('/api/v1/identity/profile', {
      method: 'PUT',
      headers: { cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ displayName: 'B', bodyWeightKg: -1 }),
    });
    expect(res.status).toBe(400);
  });

  it('usuário B não vê perfil do usuário A (escopo por dono)', async () => {
    const cookieC = await signUp('c@motusfit.test');
    await app.request('/api/v1/identity/profile', {
      method: 'PUT',
      headers: { cookie: cookieC, 'content-type': 'application/json' },
      body: JSON.stringify({ displayName: 'C', bodyWeightKg: 70 }),
    });

    const cookieD = await signUp('d@motusfit.test');
    const res = await app.request('/api/v1/identity/profile', { headers: { cookie: cookieD } });
    expect(res.status).toBe(200);
    expect(await res.json()).toBeNull();
  });
});

describe('identity.billing.getPlan (ADR 0008)', () => {
  it('usuário novo começa em plano free', async () => {
    const cookie = await signUp('billing-free@motusfit.test');
    const res = await app.request('/api/v1/identity/billing/plan', { headers: { cookie } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ plan: 'free' });
  });

  it('assinatura ativa vira premium; cancelada volta a free', async () => {
    const { cookie, userId } = await signUpFull('billing-premium@motusfit.test');
    await db.insert(schema.subscriptions).values({
      id: 'sub_billing_test',
      plan: 'premium',
      referenceId: userId,
      status: 'active',
    });

    const active = await app.request('/api/v1/identity/billing/plan', { headers: { cookie } });
    expect(await active.json()).toEqual({ plan: 'premium' });

    await db
      .update(schema.subscriptions)
      .set({ status: 'canceled' })
      .where(eq(schema.subscriptions.id, 'sub_billing_test'));

    const canceled = await app.request('/api/v1/identity/billing/plan', { headers: { cookie } });
    expect(await canceled.json()).toEqual({ plan: 'free' });
  });
});

describe('loadEnv', () => {
  it('desliga auth por padrão no desenvolvimento e exige em produção', () => {
    expect(loadEnv({ BETTER_AUTH_SECRET: 'segredo-de-teste-min-16-chars' }).authEnabled).toBe(
      false,
    );
    expect(
      loadEnv({
        NODE_ENV: 'production',
        BETTER_AUTH_SECRET: 'segredo-de-teste-min-16-chars',
      }).authEnabled,
    ).toBe(true);
  });

  it('rejeita env inválida', () => {
    expect(() => loadEnv({ API_PORT: 'abc' })).toThrow(/inválidas/);
  });
});
