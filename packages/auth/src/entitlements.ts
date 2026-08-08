import { type Database, schema } from '@motusfit/db';
import { and, eq, or } from 'drizzle-orm';
import { PREMIUM_PLAN_NAME } from './billing';

export type Plan = 'free' | 'premium';

/** Status Stripe que contam como acesso ativo ao plano (docs/adr/0008). */
const ACTIVE_STATUSES = ['active', 'trialing'] as const;

/**
 * Deriva o plano do usuário a partir da tabela `subscriptions` (espelho do
 * Stripe via webhook — ADR 0008). Sem assinatura ativa ⇒ free. Único ponto
 * de leitura de entitlement na API; handlers nunca leem `subscriptions` direto.
 */
export async function getUserPlan(db: Database, userId: string): Promise<Plan> {
  const rows = await db
    .select({ id: schema.subscriptions.id })
    .from(schema.subscriptions)
    .where(
      and(
        eq(schema.subscriptions.referenceId, userId),
        eq(schema.subscriptions.plan, PREMIUM_PLAN_NAME),
        or(...ACTIVE_STATUSES.map((status) => eq(schema.subscriptions.status, status))),
      ),
    )
    .limit(1);
  return rows.length > 0 ? 'premium' : 'free';
}
