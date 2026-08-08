import { boolean, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './auth';

// Tabela exigida pelo plugin Stripe do Better Auth (ADR 0008).
// Shape segue a referência oficial do plugin; não editar sem conferir a doc.
// Stripe é a fonte da verdade — esta tabela é um espelho sincronizado via webhook.

export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  plan: text('plan').notNull(),
  // ADR 0008: referenceId = users.id (sem organizações no MVP)
  referenceId: text('reference_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  status: text('status').notNull().default('incomplete'),
  periodStart: timestamp('period_start', { withTimezone: true }),
  periodEnd: timestamp('period_end', { withTimezone: true }),
  trialStart: timestamp('trial_start', { withTimezone: true }),
  trialEnd: timestamp('trial_end', { withTimezone: true }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  cancelAt: timestamp('cancel_at', { withTimezone: true }),
  canceledAt: timestamp('canceled_at', { withTimezone: true }),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  seats: integer('seats'),
  billingInterval: text('billing_interval'),
  stripeScheduleId: text('stripe_schedule_id'),
});
