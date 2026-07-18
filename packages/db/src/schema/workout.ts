import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './auth';

// Contexto Workout (docs/database.md)

export const exercises = pgTable(
  'exercises',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // NULL = catálogo seed, visível a todos
    ownerId: text('owner_id').references(() => users.id, { onDelete: 'cascade' }),
    source: text('source', { enum: ['user', 'catalog'] })
      .notNull()
      .default('user'),
    name: text('name').notNull(),
    muscleGroup: text('muscle_group', {
      enum: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core', 'other'],
    }).notNull(),
    equipment: text('equipment'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('exercises_owner_name_uq').on(table.ownerId, table.name)],
);

export const routines = pgTable('routines', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  notes: text('notes'),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const routineExercises = pgTable(
  'routine_exercises',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    routineId: uuid('routine_id')
      .notNull()
      .references(() => routines.id, { onDelete: 'cascade' }),
    exerciseId: uuid('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'restrict' }),
    position: integer('position').notNull(),
    targetSets: integer('target_sets').notNull(),
    targetRepsMin: integer('target_reps_min').notNull(),
    targetRepsMax: integer('target_reps_max').notNull(),
    restSeconds: integer('rest_seconds').notNull(),
  },
  (table) => [
    uniqueIndex('routine_exercises_routine_exercise_uq').on(table.routineId, table.exerciseId),
    uniqueIndex('routine_exercises_routine_position_uq').on(table.routineId, table.position),
  ],
);

export const workoutSessions = pgTable(
  'workout_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    routineId: uuid('routine_id').references(() => routines.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    // Congela o peso usado na estimativa de kcal (perfil pode mudar depois)
    bodyWeightKgSnapshot: numeric('body_weight_kg_snapshot', { precision: 5, scale: 2 }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('workout_sessions_user_started_ix').on(table.userId, table.startedAt)],
);

export const workoutSets = pgTable(
  'workout_sets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => workoutSessions.id, { onDelete: 'cascade' }),
    exerciseId: uuid('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'restrict' }),
    position: integer('position').notNull(),
    reps: integer('reps').notNull(),
    weightKg: numeric('weight_kg', { precision: 6, scale: 2 }).notNull(),
    restSeconds: integer('rest_seconds'),
    completed: boolean('completed').notNull().default(true),
    // Idempotência para retry offline (docs/api-guidelines.md §8)
    clientId: uuid('client_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('workout_sets_session_ix').on(table.sessionId),
    uniqueIndex('workout_sets_client_id_uq').on(table.sessionId, table.clientId),
  ],
);
