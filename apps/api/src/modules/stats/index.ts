import type { TodayStats, WeeklyStats } from '@motusfit/contracts';
import { isoWeekStart } from '@motusfit/core';
import { type Database, schema } from '@motusfit/db';
import { and, count, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { requireAuth } from '../../context';
import { implementedContract } from '../../implemented';

const os = implementedContract.stats;

async function todayStats(db: Database, userId: string, date: string): Promise<TodayStats> {
  const profileRows = await db
    .select({ timezone: schema.userProfiles.timezone })
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.userId, userId))
    .limit(1);
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

  return {
    date,
    workoutSessions: sessions.length,
  };
}

async function weeklyStats(db: Database, userId: string, date: string): Promise<WeeklyStats> {
  const weekStart = isoWeekStart(date);
  const weekEnd = new Date(`${weekStart}T12:00:00Z`);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  const weekEndDate = weekEnd.toISOString().slice(0, 10);

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
        sql`(${schema.workoutSessions.startedAt} AT TIME ZONE ${timezone})::date <= ${weekEndDate}`,
      ),
    );
  const sessionIds = sessions.map((s) => s.id);

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

  return {
    weekStart,
    workoutSessions: sessions.length,
    activeDays: new Set(
      sessions.map((session) =>
        new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(session.startedAt),
      ),
    ).size,
    totalVolumeKg: setAgg.reduce((acc, r) => acc + Number(r.volume), 0),
    setsByMuscleGroup: setAgg
      .map((r) => ({ muscleGroup: r.muscleGroup, sets: r.sets }))
      .sort((a, b) => b.sets - a.sets),
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
