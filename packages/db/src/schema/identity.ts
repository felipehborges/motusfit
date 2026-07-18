import { date, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './auth';

// Contexto Identity & Profile (docs/domain-model.md, docs/database.md)

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  // Peso corporal atual (kg) — usado na estimativa de kcal do treino
  bodyWeightKg: numeric('body_weight_kg', { precision: 5, scale: 2 }),
  birthDate: date('birth_date'),
  timezone: text('timezone').notNull().default('America/Sao_Paulo'),
  unitSystem: text('unit_system', { enum: ['metric', 'imperial'] })
    .notNull()
    .default('metric'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
