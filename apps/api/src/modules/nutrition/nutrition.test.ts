import { createAuth } from '@motusfit/auth';
import type { DiaryEntry, Food, NutritionGoal } from '@motusfit/contracts';
import { applyMigrations, createDatabase } from '@motusfit/db';
import type { Hono } from 'hono';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app';
import { loadEnv } from '../../env';

const env = loadEnv({
  NODE_ENV: 'test',
  BETTER_AUTH_SECRET: 'segredo-de-teste-min-16-chars',
  NUTRITION_ENABLED: 'true',
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

type DayView = {
  date: string;
  entries: DiaryEntry[];
  totals: { kcal: number; proteinG: number; carbsG: number; fatG: number };
  goal: NutritionGoal | null;
};

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

const chicken = {
  name: 'Frango grelhado',
  brand: null,
  servingSize: 100,
  servingUnit: 'g',
  kcal: 165,
  proteinG: 31,
  carbsG: 0,
  fatG: 3.6,
};

describe('nutrition', () => {
  it('fluxo completo: alimento → diário → totais → meta', async () => {
    const c = api(await signUp('n1@motusfit.test'));

    const food = await json<Food>(c.send('POST', '/nutrition/foods', chicken));
    expect(food).toMatchObject({ name: 'Frango grelhado', kcal: 165, isFavorite: false });

    const add = await c.send('POST', '/nutrition/diary', {
      date: '2026-07-18',
      mealSlot: 'lunch',
      foodId: food.id,
      quantity: 150,
    });
    expect(add.status).toBe(200);
    const entry = await json<DiaryEntry>(Promise.resolve(add));
    expect(entry.macros.kcal).toBeCloseTo(247.5);
    expect(entry.macros.proteinG).toBeCloseTo(46.5);

    await c.send('PUT', '/nutrition/goals/current', {
      kcal: 2200,
      proteinG: 160,
      carbsG: 220,
      fatG: 70,
      date: '2026-07-01',
    });

    const day = await json<DayView>(c.get('/nutrition/diary/2026-07-18'));
    expect(day.entries).toHaveLength(1);
    expect(day.totals.kcal).toBeCloseTo(247.5);
    expect(day.goal).toMatchObject({ kcal: 2200, effectiveFrom: '2026-07-01' });
  });

  it('idempotência por clientId: retry não duplica', async () => {
    const c = api(await signUp('n2@motusfit.test'));
    const food = await json<Food>(c.send('POST', '/nutrition/foods', chicken));
    const payload = {
      date: '2026-07-18',
      mealSlot: 'snack',
      foodId: food.id,
      quantity: 50,
      clientId: '0198c0de-0000-7000-8000-000000000001',
    };
    const first = await json<DiaryEntry>(c.send('POST', '/nutrition/diary', payload));
    const retry = await json<DiaryEntry>(c.send('POST', '/nutrition/diary', payload));
    expect(retry.id).toBe(first.id);

    const day = await json<DayView>(c.get('/nutrition/diary/2026-07-18'));
    expect(day.entries).toHaveLength(1);
  });

  it('update e remove recalculam o dia', async () => {
    const c = api(await signUp('n3@motusfit.test'));
    const food = await json<Food>(c.send('POST', '/nutrition/foods', chicken));
    const entry = await json<DiaryEntry>(
      c.send('POST', '/nutrition/diary', {
        date: '2026-07-18',
        mealSlot: 'dinner',
        foodId: food.id,
        quantity: 100,
      }),
    );

    const updated = await json<DiaryEntry>(
      c.send('PATCH', `/nutrition/diary/${entry.id}`, { quantity: 200 }),
    );
    expect(updated.macros.kcal).toBeCloseTo(330);

    const removed = await json<{ deleted: boolean }>(
      c.send('DELETE', `/nutrition/diary/${entry.id}`),
    );
    expect(removed).toEqual({ deleted: true });
    const day = await json<DayView>(c.get('/nutrition/diary/2026-07-18'));
    expect(day.entries).toHaveLength(0);
    expect(day.totals.kcal).toBe(0);
  });

  it('favoritos e recentes', async () => {
    const c = api(await signUp('n4@motusfit.test'));
    const food = await json<Food>(c.send('POST', '/nutrition/foods', chicken));
    const rice = await json<Food>(
      c.send('POST', '/nutrition/foods', { ...chicken, name: 'Arroz branco' }),
    );

    await c.send('PUT', `/nutrition/foods/${rice.id}/favorite`, { favorite: true });
    const search = await json<Food[]>(c.get('/nutrition/foods?limit=10'));
    expect(search[0]).toMatchObject({ id: rice.id, isFavorite: true });

    await c.send('POST', '/nutrition/diary', {
      date: '2026-07-18',
      mealSlot: 'lunch',
      foodId: food.id,
      quantity: 100,
    });
    const recent = await json<Food[]>(c.get('/nutrition/foods/recent'));
    expect(recent).toHaveLength(1);
    expect(recent[0]?.id).toBe(food.id);
  });

  it('escopo por dono: usuário B não vê nem usa alimento/diário de A', async () => {
    const a = api(await signUp('n5a@motusfit.test'));
    const b = api(await signUp('n5b@motusfit.test'));
    const foodA = await json<Food>(a.send('POST', '/nutrition/foods', chicken));
    const entryA = await json<DiaryEntry>(
      a.send('POST', '/nutrition/diary', {
        date: '2026-07-18',
        mealSlot: 'lunch',
        foodId: foodA.id,
        quantity: 100,
      }),
    );

    const searchB = await json<Food[]>(b.get('/nutrition/foods?limit=50'));
    expect(searchB.find((f) => f.id === foodA.id)).toBeUndefined();

    const addB = await b.send('POST', '/nutrition/diary', {
      date: '2026-07-18',
      mealSlot: 'lunch',
      foodId: foodA.id,
      quantity: 100,
    });
    expect(addB.status).toBe(404);

    const patchB = await b.send('PATCH', `/nutrition/diary/${entryA.id}`, { quantity: 1 });
    expect(patchB.status).toBe(404);
    const delB = await b.send('DELETE', `/nutrition/diary/${entryA.id}`);
    expect(delB.status).toBe(404);
  });

  it('troca de meta preserva vigência histórica', async () => {
    const c = api(await signUp('n6@motusfit.test'));
    await c.send('PUT', '/nutrition/goals/current', {
      kcal: 2000,
      proteinG: 150,
      carbsG: 200,
      fatG: 60,
      date: '2026-07-01',
    });
    await c.send('PUT', '/nutrition/goals/current', {
      kcal: 2400,
      proteinG: 170,
      carbsG: 250,
      fatG: 75,
      date: '2026-07-15',
    });

    const current = await json<NutritionGoal>(c.get('/nutrition/goals/current'));
    expect(current.kcal).toBe(2400);

    const oldDay = await json<DayView>(c.get('/nutrition/diary/2026-07-10'));
    expect(oldDay.goal?.kcal).toBe(2000);
    const newDay = await json<DayView>(c.get('/nutrition/diary/2026-07-18'));
    expect(newDay.goal?.kcal).toBe(2400);
  });
});
