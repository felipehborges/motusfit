import { oc } from '@orpc/contract';
import { z } from 'zod';

export const todayStatsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Sessões concluídas no dia (fuso do perfil). */
  workoutSessions: z.number().int().nonnegative(),
});
export type TodayStats = z.infer<typeof todayStatsSchema>;

export const weeklyStatsSchema = z.object({
  /** Segunda-feira da semana ISO consultada. */
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  workoutSessions: z.number().int().nonnegative(),
  activeDays: z.number().int().min(0).max(7),
  totalVolumeKg: z.number().nonnegative(),
  setsByMuscleGroup: z.array(
    z.object({ muscleGroup: z.string(), sets: z.number().int().nonnegative() }),
  ),
});
export type WeeklyStats = z.infer<typeof weeklyStatsSchema>;

export const statsContract = {
  today: oc
    .route({ method: 'GET', path: '/stats/today/{date}', tags: ['stats'] })
    .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
    .output(todayStatsSchema),
  weekly: oc
    .route({ method: 'GET', path: '/stats/weekly/{date}', tags: ['stats'] })
    .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
    .output(weeklyStatsSchema),
};
