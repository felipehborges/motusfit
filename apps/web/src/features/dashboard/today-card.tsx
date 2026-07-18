'use client';

import { roundMacrosForDisplay } from '@motusfit/core';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function TodayCard({ date }: { date: string }) {
  const statsQuery = useQuery(api.stats.today.queryOptions({ input: { date } }));

  if (!statsQuery.data) return null;
  const stats = statsQuery.data;
  const consumed = roundMacrosForDisplay(stats.consumed);

  return (
    <section className="w-full max-w-2xl rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm">
          <span className="text-2xl font-bold">{consumed.kcal}</span>
          {stats.goal && <span className="text-zinc-500"> / {stats.goal.kcal} kcal</span>}
          {stats.workoutKcal > 0 && (
            <span className="text-zinc-500"> · treino ~{Math.round(stats.workoutKcal)} kcal</span>
          )}
        </p>
        {stats.remainingKcal != null && (
          <p className={`text-sm ${stats.remainingKcal < 0 ? 'text-red-600' : 'text-green-700'}`}>
            {stats.remainingKcal >= 0
              ? `restam ${Math.round(stats.remainingKcal)} kcal`
              : `${Math.round(-stats.remainingKcal)} kcal acima da meta`}
          </p>
        )}
      </div>
      {stats.workoutSessions > 0 && (
        <p className="mt-1 text-sm text-zinc-500">
          {stats.workoutSessions} treino{stats.workoutSessions > 1 ? 's' : ''} concluído
          {stats.workoutSessions > 1 ? 's' : ''} hoje 💪
        </p>
      )}
    </section>
  );
}
