import { createAuth } from '@motusfit/auth';
import type { Food, SessionDetail, TodayStats } from '@motusfit/contracts';
import { applyMigrations, createDatabase } from '@motusfit/db';
import type { Hono } from 'hono';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app';
import { loadEnv } from '../../env';

const env = loadEnv({
  NODE_ENV: 'test',
  BETTER_AUTH_SECRET: 'segredo-de-teste-min-16-chars',
});

let app: Hono;

beforeAll(async () => {
  const db = createDatabase({ pgliteDataDir: 'memory://' });
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
  const res = await app.request('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'senha-segura-123', name: 'Teste' }),
  });
  const cookie = res.headers.get('set-cookie');
  if (!cookie) throw new Error('signup sem cookie');
  return cookie;
}

const json = async <T>(res: Response | Promise<Response>): Promise<T> =>
  (await res).json() as Promise<T>;

function api(cookie: string) {
  return {
    get: (path: string) => app.request(`/api/v1${path}`, { headers: { cookie } }),
    send: (method: string, path: string, body?: unknown) =>
      app.request(`/api/v1${path}`, {
        method,
        headers: { cookie, 'content-type': 'application/json' },
        ...(body !== undefined && { body: JSON.stringify(body) }),
      }),
  };
}

// A sessão de treino é criada "agora"; o dia consultado precisa ser o de hoje em UTC
// (timezone default do perfil só desloca em horários próximos à meia-noite — irrelevante aqui
// porque usamos o mesmo relógio para criar e consultar).
const today = new Date().toISOString().slice(0, 10);

describe('stats.today', () => {
  it('cruza diário, meta e treino do dia', async () => {
    const c = api(await signUp('s1@motusfit.test'));
    await c.send('PUT', '/identity/profile', { displayName: 'S1', bodyWeightKg: 80 });
    await c.send('PUT', '/nutrition/goals/current', {
      kcal: 2000,
      proteinG: 150,
      carbsG: 200,
      fatG: 60,
      date: today,
    });

    const food = await json<Food>(
      c.send('POST', '/nutrition/foods', {
        name: 'Arroz',
        brand: null,
        servingSize: 100,
        servingUnit: 'g',
        kcal: 130,
        proteinG: 2.7,
        carbsG: 28,
        fatG: 0.3,
      }),
    );
    await c.send('POST', '/nutrition/diary', {
      date: today,
      mealSlot: 'lunch',
      foodId: food.id,
      quantity: 200,
    });

    const exercise = await json<{ id: string }>(
      c.send('POST', '/workout/exercises', {
        name: 'Supino',
        muscleGroup: 'chest',
        equipment: null,
      }),
    );
    const session = await json<SessionDetail>(c.send('POST', '/workout/sessions', {}));
    await c.send('POST', `/workout/sessions/${session.id}/sets`, {
      sessionId: session.id,
      exerciseId: exercise.id,
      reps: 10,
      weightKg: 60,
    });
    await c.send('POST', `/workout/sessions/${session.id}/finish`, { id: session.id });

    const stats = await json<TodayStats>(c.get(`/stats/today/${today}`));
    expect(stats.consumed.kcal).toBeCloseTo(260);
    expect(stats.goal?.kcal).toBe(2000);
    expect(stats.workoutSessions).toBe(1);
    expect(stats.workoutKcal).toBeGreaterThan(0);
    expect(stats.remainingKcal).toBeCloseTo(2000 + stats.workoutKcal - 260, 5);
  });

  it('sem meta, remainingKcal é null; sem dados, zeros', async () => {
    const c = api(await signUp('s2@motusfit.test'));
    const stats = await json<TodayStats>(c.get(`/stats/today/${today}`));
    expect(stats.consumed.kcal).toBe(0);
    expect(stats.goal).toBeNull();
    expect(stats.workoutSessions).toBe(0);
    expect(stats.remainingKcal).toBeNull();
  });
});
