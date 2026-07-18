import { oc } from '@orpc/contract';
import { z } from 'zod';

export const muscleGroupSchema = z.enum([
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'legs',
  'glutes',
  'core',
  'other',
]);
export type MuscleGroup = z.infer<typeof muscleGroupSchema>;

export const exerciseSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(200),
  muscleGroup: muscleGroupSchema,
  equipment: z.string().max(100).nullable(),
  source: z.enum(['user', 'catalog']),
});
export type Exercise = z.infer<typeof exerciseSchema>;

export const routineExerciseSchema = z.object({
  id: z.uuid(),
  exercise: exerciseSchema,
  position: z.number().int().nonnegative(),
  targetSets: z.number().int().min(1).max(20),
  targetRepsMin: z.number().int().min(1).max(100),
  targetRepsMax: z.number().int().min(1).max(100),
  restSeconds: z.number().int().min(0).max(3600),
});

export const routineSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(120),
  notes: z.string().max(2000).nullable(),
  exercises: z.array(routineExerciseSchema),
});
export type Routine = z.infer<typeof routineSchema>;

const routineExerciseInput = z
  .object({
    exerciseId: z.uuid(),
    targetSets: z.number().int().min(1).max(20),
    targetRepsMin: z.number().int().min(1).max(100),
    targetRepsMax: z.number().int().min(1).max(100),
    restSeconds: z.number().int().min(0).max(3600),
  })
  .refine((v) => v.targetRepsMax >= v.targetRepsMin, {
    message: 'targetRepsMax deve ser >= targetRepsMin',
  });

export const setSchema = z.object({
  id: z.uuid(),
  exerciseId: z.uuid(),
  position: z.number().int().nonnegative(),
  reps: z.number().int().min(1).max(1000),
  weightKg: z.number().min(0).max(2000),
  restSeconds: z.number().int().min(0).max(3600).nullable(),
  completed: z.boolean(),
});
export type WorkoutSet = z.infer<typeof setSchema>;

export const sessionSummarySchema = z.object({
  id: z.uuid(),
  title: z.string(),
  routineId: z.uuid().nullable(),
  startedAt: z.iso.datetime(),
  finishedAt: z.iso.datetime().nullable(),
  volumeKg: z.number().nonnegative(),
  totalSets: z.number().int().nonnegative(),
  estimatedKcal: z.number().nonnegative().nullable(),
});
export type SessionSummary = z.infer<typeof sessionSummarySchema>;

export const sessionDetailSchema = sessionSummarySchema.extend({
  notes: z.string().nullable(),
  sets: z.array(setSchema),
  exercises: z.array(exerciseSchema),
});
export type SessionDetail = z.infer<typeof sessionDetailSchema>;

export const workoutContract = {
  exercises: {
    create: oc
      .route({ method: 'POST', path: '/workout/exercises', tags: ['workout'] })
      .input(exerciseSchema.omit({ id: true, source: true }))
      .output(exerciseSchema),
    search: oc
      .route({ method: 'GET', path: '/workout/exercises', tags: ['workout'] })
      .input(
        z.object({
          query: z.string().max(200).optional(),
          muscleGroup: muscleGroupSchema.optional(),
          limit: z.coerce.number().int().min(1).max(100).default(50),
        }),
      )
      .output(z.array(exerciseSchema)),
  },
  routines: {
    list: oc
      .route({ method: 'GET', path: '/workout/routines', tags: ['workout'] })
      .output(z.array(routineSchema)),
    create: oc
      .route({ method: 'POST', path: '/workout/routines', tags: ['workout'] })
      .input(
        z.object({
          name: z.string().min(1).max(120),
          notes: z.string().max(2000).nullable().optional(),
          exercises: z.array(routineExerciseInput).max(30),
        }),
      )
      .output(routineSchema),
    update: oc
      .route({ method: 'PUT', path: '/workout/routines/{id}', tags: ['workout'] })
      .input(
        z.object({
          id: z.uuid(),
          name: z.string().min(1).max(120),
          notes: z.string().max(2000).nullable().optional(),
          exercises: z.array(routineExerciseInput).max(30),
        }),
      )
      .output(routineSchema),
    remove: oc
      .route({ method: 'DELETE', path: '/workout/routines/{id}', tags: ['workout'] })
      .input(z.object({ id: z.uuid() }))
      .output(z.object({ deleted: z.boolean() })),
  },
  sessions: {
    start: oc
      .route({ method: 'POST', path: '/workout/sessions', tags: ['workout'] })
      .input(
        z.object({
          routineId: z.uuid().optional(),
          title: z.string().min(1).max(120).optional(),
        }),
      )
      .output(sessionDetailSchema),
    addSet: oc
      .route({ method: 'POST', path: '/workout/sessions/{sessionId}/sets', tags: ['workout'] })
      .input(
        z.object({
          sessionId: z.uuid(),
          exerciseId: z.uuid(),
          reps: z.number().int().min(1).max(1000),
          weightKg: z.number().min(0).max(2000),
          restSeconds: z.number().int().min(0).max(3600).nullable().optional(),
          completed: z.boolean().default(true),
          clientId: z.uuid().optional(),
        }),
      )
      .output(setSchema),
    removeSet: oc
      .route({
        method: 'DELETE',
        path: '/workout/sessions/{sessionId}/sets/{setId}',
        tags: ['workout'],
      })
      .input(z.object({ sessionId: z.uuid(), setId: z.uuid() }))
      .output(z.object({ deleted: z.boolean() })),
    finish: oc
      .route({ method: 'POST', path: '/workout/sessions/{id}/finish', tags: ['workout'] })
      .input(z.object({ id: z.uuid(), notes: z.string().max(2000).nullable().optional() }))
      .output(sessionDetailSchema),
    get: oc
      .route({ method: 'GET', path: '/workout/sessions/{id}', tags: ['workout'] })
      .input(z.object({ id: z.uuid() }))
      .output(sessionDetailSchema),
    history: oc
      .route({ method: 'GET', path: '/workout/sessions', tags: ['workout'] })
      .input(
        z.object({
          cursor: z.iso.datetime().optional(),
          limit: z.coerce.number().int().min(1).max(100).default(20),
        }),
      )
      .output(
        z.object({
          sessions: z.array(sessionSummarySchema),
          nextCursor: z.iso.datetime().nullable(),
        }),
      ),
    /** Últimos sets do usuário por exercício — pré-preenche a próxima sessão. */
    lastSets: oc
      .route({
        method: 'GET',
        path: '/workout/exercises/{exerciseId}/last-sets',
        tags: ['workout'],
      })
      .input(z.object({ exerciseId: z.uuid() }))
      .output(z.array(setSchema)),
  },
};
