import { createAuth } from '@motusfit/auth';
import type { Exercise, Routine, SessionDetail, WorkoutSet } from '@motusfit/contracts';
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

async function createBench(c: ReturnType<typeof api>): Promise<Exercise> {
  return json<Exercise>(
    c.send('POST', '/workout/exercises', {
      name: 'Supino reto',
      muscleGroup: 'chest',
      equipment: 'barra',
    }),
  );
}

describe('workout', () => {
  it('exercícios: cria, busca por grupo, rejeita nome duplicado', async () => {
    const c = api(await signUp('w1@motusfit.test'));
    const bench = await createBench(c);
    expect(bench).toMatchObject({ name: 'Supino reto', muscleGroup: 'chest', source: 'user' });

    const dup = await c.send('POST', '/workout/exercises', {
      name: 'Supino reto',
      muscleGroup: 'chest',
      equipment: null,
    });
    expect(dup.status).toBe(409);

    const byGroup = await json<Exercise[]>(c.get('/workout/exercises?muscleGroup=chest'));
    expect(byGroup.map((e) => e.id)).toContain(bench.id);
  });

  it('rotina: CRUD com prescrição e reordenação', async () => {
    const c = api(await signUp('w2@motusfit.test'));
    const bench = await createBench(c);
    const squat = await json<Exercise>(
      c.send('POST', '/workout/exercises', {
        name: 'Agachamento',
        muscleGroup: 'legs',
        equipment: null,
      }),
    );

    const routine = await json<Routine>(
      c.send('POST', '/workout/routines', {
        name: 'Full body A',
        exercises: [
          {
            exerciseId: bench.id,
            targetSets: 3,
            targetRepsMin: 8,
            targetRepsMax: 12,
            restSeconds: 90,
          },
          {
            exerciseId: squat.id,
            targetSets: 4,
            targetRepsMin: 5,
            targetRepsMax: 8,
            restSeconds: 120,
          },
        ],
      }),
    );
    expect(routine.exercises.map((e) => e.exercise.id)).toEqual([bench.id, squat.id]);

    const updated = await json<Routine>(
      c.send('PUT', `/workout/routines/${routine.id}`, {
        id: routine.id,
        name: 'Full body A',
        exercises: [
          {
            exerciseId: squat.id,
            targetSets: 4,
            targetRepsMin: 5,
            targetRepsMax: 8,
            restSeconds: 120,
          },
          {
            exerciseId: bench.id,
            targetSets: 3,
            targetRepsMin: 8,
            targetRepsMax: 12,
            restSeconds: 90,
          },
        ],
      }),
    );
    expect(updated.exercises.map((e) => e.exercise.id)).toEqual([squat.id, bench.id]);
    expect(updated.exercises.map((e) => e.position)).toEqual([0, 1]);

    const list = await json<Routine[]>(c.get('/workout/routines'));
    expect(list).toHaveLength(1);

    await c.send('DELETE', `/workout/routines/${routine.id}`);
    expect(await json<Routine[]>(c.get('/workout/routines'))).toHaveLength(0);
  });

  it('sessão: iniciar de rotina, sets, volume, concluir com kcal estimada', async () => {
    const c = api(await signUp('w3@motusfit.test'));
    await c.send('PUT', '/identity/profile', { displayName: 'W3', bodyWeightKg: 80 });
    const bench = await createBench(c);
    const routine = await json<Routine>(
      c.send('POST', '/workout/routines', {
        name: 'Push',
        exercises: [
          {
            exerciseId: bench.id,
            targetSets: 3,
            targetRepsMin: 8,
            targetRepsMax: 12,
            restSeconds: 90,
          },
        ],
      }),
    );

    const session = await json<SessionDetail>(
      c.send('POST', '/workout/sessions', { routineId: routine.id }),
    );
    expect(session.title).toBe('Push');
    expect(session.finishedAt).toBeNull();

    await c.send('POST', `/workout/sessions/${session.id}/sets`, {
      sessionId: session.id,
      exerciseId: bench.id,
      reps: 10,
      weightKg: 60,
    });
    await c.send('POST', `/workout/sessions/${session.id}/sets`, {
      sessionId: session.id,
      exerciseId: bench.id,
      reps: 8,
      weightKg: 65,
    });

    const finished = await json<SessionDetail>(
      c.send('POST', `/workout/sessions/${session.id}/finish`, { id: session.id }),
    );
    expect(finished.volumeKg).toBe(60 * 10 + 65 * 8);
    expect(finished.totalSets).toBe(2);
    expect(finished.finishedAt).not.toBeNull();
    // kcal = 5.0 × 80 kg × duração(h) — duração ínfima no teste, mas não-nula
    expect(finished.estimatedKcal).not.toBeNull();

    const blocked = await c.send('POST', `/workout/sessions/${session.id}/sets`, {
      sessionId: session.id,
      exerciseId: bench.id,
      reps: 5,
      weightKg: 60,
    });
    expect(blocked.status).toBe(409);
  });

  it('idempotência de set por clientId', async () => {
    const c = api(await signUp('w4@motusfit.test'));
    const bench = await createBench(c);
    const session = await json<SessionDetail>(c.send('POST', '/workout/sessions', {}));
    const payload = {
      sessionId: session.id,
      exerciseId: bench.id,
      reps: 10,
      weightKg: 60,
      clientId: '0198c0de-0000-7000-8000-000000000002',
    };
    const first = await json<WorkoutSet>(
      c.send('POST', `/workout/sessions/${session.id}/sets`, payload),
    );
    const retry = await json<WorkoutSet>(
      c.send('POST', `/workout/sessions/${session.id}/sets`, payload),
    );
    expect(retry.id).toBe(first.id);
  });

  it('histórico paginado e last-sets', async () => {
    const c = api(await signUp('w5@motusfit.test'));
    const bench = await createBench(c);

    for (const weight of [50, 55]) {
      const session = await json<SessionDetail>(c.send('POST', '/workout/sessions', {}));
      await c.send('POST', `/workout/sessions/${session.id}/sets`, {
        sessionId: session.id,
        exerciseId: bench.id,
        reps: 10,
        weightKg: weight,
      });
      await c.send('POST', `/workout/sessions/${session.id}/finish`, { id: session.id });
    }

    const history = await json<{ sessions: { volumeKg: number }[]; nextCursor: string | null }>(
      c.get('/workout/sessions?limit=1'),
    );
    expect(history.sessions).toHaveLength(1);
    expect(history.nextCursor).not.toBeNull();

    const last = await json<WorkoutSet[]>(c.get(`/workout/exercises/${bench.id}/last-sets`));
    expect(last).toHaveLength(1);
    expect(last[0]?.weightKg).toBe(55);
  });

  it('escopo por dono: B não acessa rotina/sessão de A', async () => {
    const a = api(await signUp('w6a@motusfit.test'));
    const b = api(await signUp('w6b@motusfit.test'));
    const bench = await createBench(a);
    const routine = await json<Routine>(
      a.send('POST', '/workout/routines', {
        name: 'Privada',
        exercises: [
          {
            exerciseId: bench.id,
            targetSets: 3,
            targetRepsMin: 8,
            targetRepsMax: 12,
            restSeconds: 60,
          },
        ],
      }),
    );
    const session = await json<SessionDetail>(
      a.send('POST', '/workout/sessions', { routineId: routine.id }),
    );

    expect((await b.send('POST', '/workout/sessions', { routineId: routine.id })).status).toBe(404);
    expect((await b.get(`/workout/sessions/${session.id}`)).status).toBe(404);
    expect(
      (
        await b.send('POST', `/workout/sessions/${session.id}/sets`, {
          sessionId: session.id,
          exerciseId: bench.id,
          reps: 1,
          weightKg: 1,
        })
      ).status,
    ).toBe(404);
    expect((await b.send('DELETE', `/workout/routines/${routine.id}`)).status).toBe(404);
  });
});
