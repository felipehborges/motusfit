import type { TodayStats } from '@motusfit/contracts';
import { estimateSessionKcal, sumMacros } from '@motusfit/core';
import { type Database, schema } from '@motusfit/db';
import { and, eq, isNotNull, sql } from 'drizzle-orm';
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

export const statsRouter = {
  today: os.today
    .use(requireAuth)
    .handler(({ context, input }) => todayStats(context.db, context.user.id, input.date)),
};
