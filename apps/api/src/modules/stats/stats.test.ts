import { createAuth } from '@motusfit/auth';
import type { SessionDetail, TodayStats, WeeklyStats } from '@motusfit/contracts';
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

describe('stats no modo treino', () => {
  it('resume as sessões concluídas do dia', async () => {
    const c = api(await signUp('s1@motusfit.test'));

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
    expect(stats.workoutSessions).toBe(1);
  });

  it('weekly agrega sessões, volume, dias ativos e grupos musculares', async () => {
    const c = api(await signUp('s3@motusfit.test'));

    const bench = await json<{ id: string }>(
      c.send('POST', '/workout/exercises', {
        name: 'Supino',
        muscleGroup: 'chest',
        equipment: null,
      }),
    );
    const squat = await json<{ id: string }>(
      c.send('POST', '/workout/exercises', {
        name: 'Agachamento',
        muscleGroup: 'legs',
        equipment: null,
      }),
    );
    const session = await json<SessionDetail>(c.send('POST', '/workout/sessions', {}));
    for (const [exerciseId, weightKg] of [
      [bench.id, 60],
      [bench.id, 60],
      [squat.id, 100],
    ] as const) {
      await c.send('POST', `/workout/sessions/${session.id}/sets`, {
        sessionId: session.id,
        exerciseId,
        reps: 10,
        weightKg,
      });
    }
    await c.send('POST', `/workout/sessions/${session.id}/finish`, { id: session.id });

    const weekly = await json<WeeklyStats>(c.get(`/stats/weekly/${today}`));
    expect(weekly.workoutSessions).toBe(1);
    expect(weekly.activeDays).toBe(1);
    expect(weekly.totalVolumeKg).toBe(60 * 10 + 60 * 10 + 100 * 10);
    expect(weekly.setsByMuscleGroup).toEqual([
      { muscleGroup: 'chest', sets: 2 },
      { muscleGroup: 'legs', sets: 1 },
    ]);
  });

  it('sem dados, retorna zeros', async () => {
    const c = api(await signUp('s2@motusfit.test'));
    const stats = await json<TodayStats>(c.get(`/stats/today/${today}`));
    expect(stats.workoutSessions).toBe(0);
  });
});
