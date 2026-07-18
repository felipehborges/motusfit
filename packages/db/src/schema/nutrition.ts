import { sql } from 'drizzle-orm';
import {
  date,
  index,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './auth';

// Contexto Nutrition (docs/database.md). Macros são por porção base.

export const foods = pgTable(
  'foods',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // NULL = alimento de catálogo público (pós-MVP)
    ownerId: text('owner_id').references(() => users.id, { onDelete: 'cascade' }),
    source: text('source', { enum: ['user', 'catalog'] })
      .notNull()
      .default('user'),
    name: text('name').notNull(),
    brand: text('brand'),
    servingSize: numeric('serving_size', { precision: 8, scale: 2 }).notNull(),
    servingUnit: text('serving_unit', { enum: ['g', 'ml', 'unit'] }).notNull(),
    kcal: numeric('kcal', { precision: 8, scale: 1 }).notNull(),
    proteinG: numeric('protein_g', { precision: 8, scale: 2 }).notNull(),
    carbsG: numeric('carbs_g', { precision: 8, scale: 2 }).notNull(),
    fatG: numeric('fat_g', { precision: 8, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('foods_owner_name_ix').on(table.ownerId, table.name)],
);

export const foodFavorites = pgTable(
  'food_favorites',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    foodId: uuid('food_id')
      .notNull()
      .references(() => foods.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.foodId] })],
);

export const diaryEntries = pgTable(
  'diary_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    mealSlot: text('meal_slot', { enum: ['breakfast', 'lunch', 'dinner', 'snack'] }).notNull(),
    foodId: uuid('food_id')
      .notNull()
      .references(() => foods.id, { onDelete: 'restrict' }),
    quantity: numeric('quantity', { precision: 8, scale: 2 }).notNull(),
    // Idempotência para retry offline (docs/api-guidelines.md §8)
    clientId: uuid('client_id'),
    loggedAt: timestamp('logged_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('diary_entries_user_date_ix').on(table.userId, table.date),
    uniqueIndex('diary_entries_client_id_uq').on(table.userId, table.clientId),
  ],
);

export const nutritionGoals = pgTable(
  'nutrition_goals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kcal: numeric('kcal', { precision: 8, scale: 1 }).notNull(),
    proteinG: numeric('protein_g', { precision: 8, scale: 2 }).notNull(),
    carbsG: numeric('carbs_g', { precision: 8, scale: 2 }).notNull(),
    fatG: numeric('fat_g', { precision: 8, scale: 2 }).notNull(),
    effectiveFrom: date('effective_from').notNull(),
    // NULL = meta vigente
    effectiveTo: date('effective_to'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('nutrition_goals_current_uq')
      .on(table.userId)
      .where(sql`${table.effectiveTo} IS NULL`),
  ],
);
