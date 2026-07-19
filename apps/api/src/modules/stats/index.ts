import type { TodayStats, WeeklyStats } from '@motusfit/contracts';
import { estimateSessionKcal, isoWeekStart, sumMacros } from '@motusfit/core';
import { type Database, schema } from '@motusfit/db';
import { and, count, eq, gte, inArray, isNotNull, lte, sql } from 'drizzle-orm';
import { requireAuth } from '../../context';
import { implementedContract } from '../../implemented';
import { getGoalForDate, listEntriesByDay } from '../nutrition/nutrition.repository';

const os = implementedContract.stats;

/**
 * Agregação read-only cruzando contextos — Stats só LÊ dos outros módulos
 * (docs/domain-model.md); nunca escreve.
 */
async function todayStats(db: Database, userId: string, date: string): Promise<TodayStats> {
  const [entries, goal, profileRows] = await Promise.all([
    listEntriesByDay(db, userId, date),
    getGoalForDate(db, userId, date),
    db
      .select({ timezone: schema.userProfiles.timezone })
      .from(schema.userProfiles)
      .where(eq(schema.userProfiles.userId, userId))
      .limit(1),
  ]);
  const timezone = profileRows[0]?.timezone ?? 'America/Sao_Paulo';

  const sessions = await db
    .select()
    .from(schema.workoutSessions)
    .where(
      and(
        eq(schema.workoutSessions.userId, userId),
        isNotNull(schema.workoutSessions.finishedAt),
        sql`(${schema.workoutSessions.startedAt} AT TIME ZONE ${timezone})::date = ${date}`,
      ),
    );

  const workoutKcal = sessions.reduce((acc, s) => {
    const weight = s.bodyWeightKgSnapshot === null ? null : Number(s.bodyWeightKgSnapshot);
    if (!weight || !s.finishedAt) return acc;
    return (
      acc +
      estimateSessionKcal({
        bodyWeightKg: weight,
        durationMinutes: (s.finishedAt.getTime() - s.startedAt.getTime()) / 60_000,
      })
    );
  }, 0);

  const consumed = sumMacros(entries.map((e) => e.macros));

  return {
    date,
    consumed,
    goal,
    workoutSessions: sessions.length,
    workoutKcal,
    remainingKcal: goal ? goal.kcal + workoutKcal - consumed.kcal : null,
  };
}

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, (d ?? 1) + days));
  return dt.toISOString().slice(0, 10);
}

async function weeklyStats(db: Database, userId: string, date: string): Promise<WeeklyStats> {
  const weekStart = isoWeekStart(date);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = weekDays[6] as string;

  const profileRows = await db
    .select({ timezone: schema.userProfiles.timezone })
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.userId, userId))
    .limit(1);
  const timezone = profileRows[0]?.timezone ?? 'America/Sao_Paulo';

  // Sessões concluídas na semana (fuso do perfil)
  const sessions = await db
    .select()
    .from(schema.workoutSessions)
    .where(
      and(
        eq(schema.workoutSessions.userId, userId),
        isNotNull(schema.workoutSessions.finishedAt),
        sql`(${schema.workoutSessions.startedAt} AT TIME ZONE ${timezone})::date >= ${weekStart}`,
        sql`(${schema.workoutSessions.startedAt} AT TIME ZONE ${timezone})::date <= ${weekEnd}`,
      ),
    );
  const sessionIds = sessions.map((s) => s.id);

  const workoutKcal = sessions.reduce((acc, s) => {
    const weight = s.bodyWeightKgSnapshot === null ? null : Number(s.bodyWeightKgSnapshot);
    if (!weight || !s.finishedAt) return acc;
    return (
      acc +
      estimateSessionKcal({
        bodyWeightKg: weight,
        durationMinutes: (s.finishedAt.getTime() - s.startedAt.getTime()) / 60_000,
      })
    );
  }, 0);

  // Volume e séries por grupo muscular — uma query agregada, sem N+1
  const setAgg = sessionIds.length
    ? await db
        .select({
          muscleGroup: schema.exercises.muscleGroup,
          sets: count(schema.workoutSets.id),
          volume: sql<string>`COALESCE(SUM(${schema.workoutSets.weightKg} * ${schema.workoutSets.reps}), 0)`,
        })
        .from(schema.workoutSets)
        .innerJoin(schema.exercises, eq(schema.exercises.id, schema.workoutSets.exerciseId))
        .where(
          and(
            inArray(schema.workoutSets.sessionId, sessionIds),
            eq(schema.workoutSets.completed, true),
          ),
        )
        .groupBy(schema.exercises.muscleGroup)
    : [];

  // kcal consumidas por dia — agregado no banco
  const kcalRows = await db
    .select({
      date: schema.diaryEntries.date,
      kcal: sql<string>`COALESCE(SUM(${schema.foods.kcal} * ${schema.diaryEntries.quantity} / ${schema.foods.servingSize}), 0)`,
    })
    .from(schema.diaryEntries)
    .innerJoin(schema.foods, eq(schema.foods.id, schema.diaryEntries.foodId))
    .where(
      and(
        eq(schema.diaryEntries.userId, userId),
        gte(schema.diaryEntries.date, weekStart),
        lte(schema.diaryEntries.date, weekEnd),
      ),
    )
    .groupBy(schema.diaryEntries.date);
  const kcalByDate = new Map(kcalRows.map((r) => [r.date, Number(r.kcal)]));

  return {
    weekStart,
    workoutSessions: sessions.length,
    totalVolumeKg: setAgg.reduce((acc, r) => acc + Number(r.volume), 0),
    workoutKcal,
    setsByMuscleGroup: setAgg
      .map((r) => ({ muscleGroup: r.muscleGroup, sets: r.sets }))
      .sort((a, b) => b.sets - a.sets),
    kcalByDay: weekDays.map((day) => ({ date: day, kcal: kcalByDate.get(day) ?? 0 })),
  };
}

export const statsRouter = {
  today: os.today
    .use(requireAuth)
    .handler(({ context, input }) => todayStats(context.db, context.user.id, input.date)),
  weekly: os.weekly
    .use(requireAuth)
    .handler(({ context, input }) => weeklyStats(context.db, context.user.id, input.date)),
};
