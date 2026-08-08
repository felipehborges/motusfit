import { applyMigrations, createDatabase, schema } from '@motusfit/db';
import { call, os } from '@orpc/server';
import { beforeAll, describe, expect, it } from 'vitest';
import type { AppContext } from './context';
import { requirePremium } from './context';

let db: Awaited<ReturnType<typeof createDatabase>>;

beforeAll(async () => {
  db = createDatabase({ pgliteDataDir: 'memory://' });
  await applyMigrations(db);
});

async function createUser(id: string): Promise<void> {
  await db.insert(schema.users).values({ id, name: 'Teste', email: `${id}@motusfit.test` });
}

function contextFor(userId: string): AppContext {
  return {
    db,
    // requirePremium não usa `auth`; cast simplifica o teste de middleware isolado
    auth: {} as AppContext['auth'],
    user: { id: userId, email: `${userId}@motusfit.test`, name: 'Teste' },
  };
}

// Procedimento de teste — nenhuma feature premium existe ainda (Fase 7.3
// segue não definida), este teste valida só o mecanismo de gating (ADR 0008).
const premiumOnlyProcedure = os
  .$context<AppContext>()
  .use(requirePremium)
  .handler(() => 'ok' as const);

describe('requirePremium', () => {
  it('bloqueia usuário sem assinatura ativa (plano free)', async () => {
    await createUser('free-user');
    await expect(
      call(premiumOnlyProcedure, undefined, { context: contextFor('free-user') }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('libera usuário com assinatura premium ativa', async () => {
    await createUser('premium-user');
    await db.insert(schema.subscriptions).values({
      id: 'sub_1',
      plan: 'premium',
      referenceId: 'premium-user',
      status: 'active',
    });

    const result = await call(premiumOnlyProcedure, undefined, {
      context: contextFor('premium-user'),
    });
    expect(result).toBe('ok');
  });

  it('não libera assinatura cancelada', async () => {
    await createUser('canceled-user');
    await db.insert(schema.subscriptions).values({
      id: 'sub_2',
      plan: 'premium',
      referenceId: 'canceled-user',
      status: 'canceled',
    });

    await expect(
      call(premiumOnlyProcedure, undefined, { context: contextFor('canceled-user') }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});
