import type {
  Exercise,
  MuscleGroup,
  Routine,
  SessionDetail,
  SessionSummary,
  WorkoutSet,
} from '@motusfit/contracts';
import { estimateSessionKcal, sessionVolumeKg } from '@motusfit/core';
import { type Database, schema } from '@motusfit/db';
import { and, desc, eq, ilike, inArray, isNull, lt, max, or } from 'drizzle-orm';

type ExerciseRow = typeof schema.exercises.$inferSelect;
type SessionRow = typeof schema.workoutSessions.$inferSelect;
type SetRow = typeof schema.workoutSets.$inferSelect;

function toExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscleGroup,
    equipment: row.equipment,
    source: row.source,
  };
}

function toSet(row: SetRow): WorkoutSet {
  return {
    id: row.id,
    exerciseId: row.exerciseId,
    position: row.position,
    reps: row.reps,
    weightKg: Number(row.weightKg),
    restSeconds: row.restSeconds,
    completed: row.completed,
  };
}

function toSummary(row: SessionRow, sets: WorkoutSet[]): SessionSummary {
  const finished = row.finishedAt;
  const weight = row.bodyWeightKgSnapshot === null ? null : Number(row.bodyWeightKgSnapshot);
  const estimatedKcal =
    finished && weight
      ? estimateSessionKcal({
          bodyWeightKg: weight,
          durationMinutes: (finished.getTime() - row.startedAt.getTime()) / 60_000,
        })
      : null;
  return {
    id: row.id,
    title: row.title,
    routineId: row.routineId,
    startedAt: row.startedAt.toISOString(),
    finishedAt: finished ? finished.toISOString() : null,
    volumeKg: sessionVolumeKg(sets),
    totalSets: sets.filter((s) => s.completed).length,
    estimatedKcal,
  };
}

function accessibleExercise(userId: string) {
  return or(eq(schema.exercises.ownerId, userId), isNull(schema.exercises.ownerId));
}

// ---------- Exercises ----------

export async function createExercise(
  db: Database,
  userId: string,
  data: { name: string; muscleGroup: MuscleGroup; equipment?: string | null | undefined },
): Promise<Exercise | null> {
  const rows = await db
    .insert(schema.exercises)
    .values({
      ownerId: userId,
      source: 'user',
      name: data.name,
      muscleGroup: data.muscleGroup,
      equipment: data.equipment ?? null,
    })
    .onConflictDoNothing()
    .returning();
  const row = rows[0];
  // Conflito ⇒ nome duplicado para o usuário
  return row ? toExercise(row) : null;
}

export async function searchExercises(
  db: Database,
  userId: string,
  filter: { query?: string | undefined; muscleGroup?: MuscleGroup | undefined; limit: number },
): Promise<Exercise[]> {
  const rows = await db
    .select()
    .from(schema.exercises)
    .where(
      and(
        accessibleExercise(userId),
        filter.query ? ilike(schema.exercises.name, `%${filter.query}%`) : undefined,
        filter.muscleGroup ? eq(schema.exercises.muscleGroup, filter.muscleGroup) : undefined,
      ),
    )
    .orderBy(schema.exercises.name)
    .limit(filter.limit);
  return rows.map(toExercise);
}

// ---------- Routines ----------

export type RoutineExerciseInput = {
  exerciseId: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  restSeconds: number;
};

async function loadRoutine(db: Database, routineId: string): Promise<Routine | null> {
  const routineRows = await db
    .select()
    .from(schema.routines)
    .where(eq(schema.routines.id, routineId))
    .limit(1);
  const routine = routineRows[0];
  if (!routine) return null;

  const items = await db
    .select({ re: schema.routineExercises, exercise: schema.exercises })
    .from(schema.routineExercises)
    .innerJoin(schema.exercises, eq(schema.exercises.id, schema.routineExercises.exerciseId))
    .where(eq(schema.routineExercises.routineId, routineId))
    .orderBy(schema.routineExercises.position);

  return {
    id: routine.id,
    name: routine.name,
    notes: routine.notes,
    exercises: items.map(({ re, exercise }) => ({
      id: re.id,
      exercise: toExercise(exercise),
      position: re.position,
      targetSets: re.targetSets,
      targetRepsMin: re.targetRepsMin,
      targetRepsMax: re.targetRepsMax,
      restSeconds: re.restSeconds,
    })),
  };
}

/** Valida que todos os exercícios são acessíveis; retorna false se algum não for. */
async function validateExercises(
  db: Database,
  userId: string,
  exerciseIds: string[],
): Promise<boolean> {
  if (exerciseIds.length === 0) return true;
  const rows = await db
    .select({ id: schema.exercises.id })
    .from(schema.exercises)
    .where(and(inArray(schema.exercises.id, exerciseIds), accessibleExercise(userId)));
  return rows.length === new Set(exerciseIds).size;
}

export async function listRoutines(db: Database, userId: string): Promise<Routine[]> {
  const rows = await db
    .select({ id: schema.routines.id })
    .from(schema.routines)
    .where(and(eq(schema.routines.userId, userId), isNull(schema.routines.archivedAt)))
    .orderBy(schema.routines.name);
  const routines = await Promise.all(rows.map((r) => loadRoutine(db, r.id)));
  return routines.filter((r): r is Routine => r !== null);
}

export async function createRoutine(
  db: Database,
  userId: string,
  data: { name: string; notes?: string | null | undefined; exercises: RoutineExerciseInput[] },
): Promise<Routine | null> {
  if (
    !(await validateExercises(
      db,
      userId,
      data.exercises.map((e) => e.exerciseId),
    ))
  ) {
    return null;
  }
  return db.transaction(async (tx) => {
    const rows = await tx
      .insert(schema.routines)
      .values({ userId, name: data.name, notes: data.notes ?? null })
      .returning();
    const routine = rows[0];
    if (!routine) throw new Error('insert de rotina não retornou linha');
    if (data.exercises.length > 0) {
      await tx.insert(schema.routineExercises).values(
        data.exercises.map((e, position) => ({
          routineId: routine.id,
          exerciseId: e.exerciseId,
          position,
          targetSets: e.targetSets,
          targetRepsMin: e.targetRepsMin,
          targetRepsMax: e.targetRepsMax,
          restSeconds: e.restSeconds,
        })),
      );
    }
    const loaded = await loadRoutine(tx as unknown as Database, routine.id);
    if (!loaded) throw new Error('rotina recém-criada não encontrada');
    return loaded;
  });
}

export async function updateRoutine(
  db: Database,
  userId: string,
  data: {
    id: string;
    name: string;
    notes?: string | null | undefined;
    exercises: RoutineExerciseInput[];
  },
): Promise<Routine | null> {
  const owned = await db
    .select({ id: schema.routines.id })
    .from(schema.routines)
    .where(and(eq(schema.routines.id, data.id), eq(schema.routines.userId, userId)))
    .limit(1);
  if (!owned[0]) return null;
  if (
    !(await validateExercises(
      db,
      userId,
      data.exercises.map((e) => e.exerciseId),
    ))
  ) {
    return null;
  }

  return db.transaction(async (tx) => {
    await tx
      .update(schema.routines)
      .set({ name: data.name, notes: data.notes ?? null, updatedAt: new Date() })
      .where(eq(schema.routines.id, data.id));
    // Substituição integral preserva a invariante de posições sem buracos
    await tx.delete(schema.routineExercises).where(eq(schema.routineExercises.routineId, data.id));
    if (data.exercises.length > 0) {
      await tx.insert(schema.routineExercises).values(
        data.exercises.map((e, position) => ({
          routineId: data.id,
          exerciseId: e.exerciseId,
          position,
          targetSets: e.targetSets,
          targetRepsMin: e.targetRepsMin,
          targetRepsMax: e.targetRepsMax,
          restSeconds: e.restSeconds,
        })),
      );
    }
    return loadRoutine(tx as unknown as Database, data.id);
  });
}

export async function removeRoutine(db: Database, userId: string, id: string): Promise<boolean> {
  const rows = await db
    .delete(schema.routines)
    .where(and(eq(schema.routines.id, id), eq(schema.routines.userId, userId)))
    .returning();
  return rows.length > 0;
}

// ---------- Sessions ----------

async function loadSessionDetail(db: Database, row: SessionRow): Promise<SessionDetail> {
  const setRows = await db
    .select()
    .from(schema.workoutSets)
    .where(eq(schema.workoutSets.sessionId, row.id))
    .orderBy(schema.workoutSets.position);
  const sets = setRows.map(toSet);

  const exerciseIds = [...new Set(sets.map((s) => s.exerciseId))];
  const exerciseRows = exerciseIds.length
    ? await db.select().from(schema.exercises).where(inArray(schema.exercises.id, exerciseIds))
    : [];

  const sessionRoutineRows = row.routineId
    ? await db
        .select({ re: schema.routineExercises, exercise: schema.exercises })
        .from(schema.routineExercises)
        .innerJoin(schema.exercises, eq(schema.exercises.id, schema.routineExercises.exerciseId))
        .where(eq(schema.routineExercises.routineId, row.routineId))
        .orderBy(schema.routineExercises.position)
    : [];

  // Exercícios da sessão: os da rotina (ordem prescrita) + extras com sets
  const byId = new Map<string, Exercise>();
  for (const { exercise } of sessionRoutineRows) byId.set(exercise.id, toExercise(exercise));
  for (const ex of exerciseRows) if (!byId.has(ex.id)) byId.set(ex.id, toExercise(ex));

  return {
    ...toSummary(row, sets),
    notes: row.notes,
    sets,
    exercises: [...byId.values()],
  };
}

export async function startSession(
  db: Database,
  userId: string,
  data: { routineId?: string | undefined; title?: string | undefined },
): Promise<SessionDetail | null> {
  let title = data.title ?? 'Treino livre';
  if (data.routineId) {
    const routineRows = await db
      .select()
      .from(schema.routines)
      .where(and(eq(schema.routines.id, data.routineId), eq(schema.routines.userId, userId)))
      .limit(1);
    const routine = routineRows[0];
    if (!routine) return null;
    title = data.title ?? routine.name;
  }

  const profile = await db
    .select({ bodyWeightKg: schema.userProfiles.bodyWeightKg })
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.userId, userId))
    .limit(1);

  const rows = await db
    .insert(schema.workoutSessions)
    .values({
      userId,
      routineId: data.routineId ?? null,
      title,
      bodyWeightKgSnapshot: profile[0]?.bodyWeightKg ?? null,
    })
    .returning();
  const row = rows[0];
  if (!row) throw new Error('insert de sessão não retornou linha');
  return loadSessionDetail(db, row);
}

async function findOwnedSession(
  db: Database,
  userId: string,
  sessionId: string,
): Promise<SessionRow | null> {
  const rows = await db
    .select()
    .from(schema.workoutSessions)
    .where(and(eq(schema.workoutSessions.id, sessionId), eq(schema.workoutSessions.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export type AddSetResult = { set: WorkoutSet } | 'session-not-found' | 'session-finished';

export async function addSet(
  db: Database,
  userId: string,
  data: {
    sessionId: string;
    exerciseId: string;
    reps: number;
    weightKg: number;
    restSeconds?: number | null | undefined;
    completed: boolean;
    clientId?: string | undefined;
  },
): Promise<AddSetResult | 'exercise-not-found'> {
  const session = await findOwnedSession(db, userId, data.sessionId);
  if (!session) return 'session-not-found';
  if (session.finishedAt) return 'session-finished';

  const exercise = await db
    .select({ id: schema.exercises.id })
    .from(schema.exercises)
    .where(and(eq(schema.exercises.id, data.exerciseId), accessibleExercise(userId)))
    .limit(1);
  if (!exercise[0]) return 'exercise-not-found';

  const positionRows = await db
    .select({ maxPosition: max(schema.workoutSets.position) })
    .from(schema.workoutSets)
    .where(eq(schema.workoutSets.sessionId, data.sessionId));
  const position = (positionRows[0]?.maxPosition ?? -1) + 1;

  const inserted = await db
    .insert(schema.workoutSets)
    .values({
      sessionId: data.sessionId,
      exerciseId: data.exerciseId,
      position,
      reps: data.reps,
      weightKg: String(data.weightKg),
      restSeconds: data.restSeconds ?? null,
      completed: data.completed,
      clientId: data.clientId ?? null,
    })
    .onConflictDoNothing()
    .returning();

  let row = inserted[0];
  if (!row) {
    const existing = await db
      .select()
      .from(schema.workoutSets)
      .where(
        and(
          eq(schema.workoutSets.sessionId, data.sessionId),
          eq(schema.workoutSets.clientId, data.clientId ?? ''),
        ),
      )
      .limit(1);
    row = existing[0];
  }
  if (!row) throw new Error('insert de set não retornou linha');
  return { set: toSet(row) };
}

export async function removeSet(
  db: Database,
  userId: string,
  sessionId: string,
  setId: string,
): Promise<boolean> {
  const session = await findOwnedSession(db, userId, sessionId);
  if (!session || session.finishedAt) return false;
  const rows = await db
    .delete(schema.workoutSets)
    .where(and(eq(schema.workoutSets.id, setId), eq(schema.workoutSets.sessionId, sessionId)))
    .returning();
  return rows.length > 0;
}

export async function finishSession(
  db: Database,
  userId: string,
  id: string,
  notes: string | null,
): Promise<SessionDetail | null> {
  const session = await findOwnedSession(db, userId, id);
  if (!session) return null;
  const rows = await db
    .update(schema.workoutSessions)
    .set({
      finishedAt: session.finishedAt ?? new Date(),
      ...(notes !== null && { notes }),
      updatedAt: new Date(),
    })
    .where(eq(schema.workoutSessions.id, id))
    .returning();
  const row = rows[0];
  if (!row) return null;
  return loadSessionDetail(db, row);
}

export async function getSession(
  db: Database,
  userId: string,
  id: string,
): Promise<SessionDetail | null> {
  const session = await findOwnedSession(db, userId, id);
  if (!session) return null;
  return loadSessionDetail(db, session);
}

export async function listHistory(
  db: Database,
  userId: string,
  cursor: string | undefined,
  limit: number,
): Promise<{ sessions: SessionSummary[]; nextCursor: string | null }> {
  const rows = await db
    .select()
    .from(schema.workoutSessions)
    .where(
      and(
        eq(schema.workoutSessions.userId, userId),
        cursor ? lt(schema.workoutSessions.startedAt, new Date(cursor)) : undefined,
      ),
    )
    .orderBy(desc(schema.workoutSessions.startedAt))
    .limit(limit + 1);

  const page = rows.slice(0, limit);
  const summaries = await Promise.all(
    page.map(async (row) => {
      const setRows = await db
        .select()
        .from(schema.workoutSets)
        .where(eq(schema.workoutSets.sessionId, row.id));
      return toSummary(row, setRows.map(toSet));
    }),
  );
  const last = page[page.length - 1];
  return {
    sessions: summaries,
    nextCursor: rows.length > limit && last ? last.startedAt.toISOString() : null,
  };
}

/** Sets da última sessão concluída do usuário que contém o exercício. */
export async function lastSetsForExercise(
  db: Database,
  userId: string,
  exerciseId: string,
): Promise<WorkoutSet[]> {
  const lastSession = await db
    .select({ sessionId: schema.workoutSets.sessionId })
    .from(schema.workoutSets)
    .innerJoin(schema.workoutSessions, eq(schema.workoutSessions.id, schema.workoutSets.sessionId))
    .where(
      and(eq(schema.workoutSessions.userId, userId), eq(schema.workoutSets.exerciseId, exerciseId)),
    )
    .orderBy(desc(schema.workoutSessions.startedAt))
    .limit(1);
  const sessionId = lastSession[0]?.sessionId;
  if (!sessionId) return [];

  const rows = await db
    .select()
    .from(schema.workoutSets)
    .where(
      and(
        eq(schema.workoutSets.sessionId, sessionId),
        eq(schema.workoutSets.exerciseId, exerciseId),
      ),
    )
    .orderBy(schema.workoutSets.position);
  return rows.map(toSet);
}
