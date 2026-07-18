import { oc } from '@orpc/contract';
import { z } from 'zod';
import { macrosSchema, nutritionGoalSchema } from './nutrition';

export const todayStatsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  consumed: macrosSchema,
  goal: nutritionGoalSchema.nullable(),
  /** Sessões concluídas no dia (fuso do perfil). */
  workoutSessions: z.number().int().nonnegative(),
  /** kcal estimadas gastas em treino no dia. */
  workoutKcal: z.number().nonnegative(),
  /** meta + treino − consumido; null sem meta. */
  remainingKcal: z.number().nullable(),
});
export type TodayStats = z.infer<typeof todayStatsSchema>;

export const statsContract = {
  today: oc
    .route({ method: 'GET', path: '/stats/today/{date}', tags: ['stats'] })
    .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
    .output(todayStatsSchema),
};
