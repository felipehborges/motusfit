'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Peito',
  back: 'Costas',
  shoulders: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  legs: 'Pernas',
  glutes: 'Glúteos',
  core: 'Core',
  other: 'Outro',
};

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export function WeeklyStats({ date }: { date: string }) {
  const statsQuery = useQuery(api.stats.weekly.queryOptions({ input: { date } }));

  if (statsQuery.isPending) return <p>Carregando estatísticas…</p>;
  if (statsQuery.isError) return <p className="text-red-600">Erro ao carregar estatísticas.</p>;

  const stats = statsQuery.data;
  const maxKcal = Math.max(...stats.kcalByDay.map((d) => d.kcal), 1);
  const maxSets = Math.max(...stats.setsByMuscleGroup.map((g) => g.sets), 1);

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">Semana de {stats.weekStart}</h2>
        <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div className="rounded bg-zinc-50 p-2 dark:bg-zinc-900">
            <dt className="text-xs text-zinc-500">Sessões</dt>
            <dd className="font-semibold">{stats.workoutSessions}</dd>
          </div>
          <div className="rounded bg-zinc-50 p-2 dark:bg-zinc-900">
            <dt className="text-xs text-zinc-500">Volume total</dt>
            <dd className="font-semibold">{Math.round(stats.totalVolumeKg)} kg</dd>
          </div>
          <div className="rounded bg-zinc-50 p-2 dark:bg-zinc-900">
            <dt className="text-xs text-zinc-500">kcal treino</dt>
            <dd className="font-semibold">{Math.round(stats.workoutKcal)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h3 className="font-semibold">Calorias por dia</h3>
        <div className="mt-3 flex items-end gap-2" style={{ height: 120 }}>
          {stats.kcalByDay.map((day, index) => (
            <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-zinc-900 dark:bg-zinc-100"
                style={{ height: `${Math.max((day.kcal / maxKcal) * 100, day.kcal > 0 ? 4 : 0)}%` }}
                title={`${Math.round(day.kcal)} kcal`}
              />
              <span className="text-xs text-zinc-500">{WEEKDAY_LABELS[index]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h3 className="font-semibold">Séries por grupo muscular</h3>
        {stats.setsByMuscleGroup.length === 0 && (
          <p className="mt-2 text-sm text-zinc-500">Nenhuma série completa nesta semana.</p>
        )}
        <ul className="mt-3 flex flex-col gap-2">
          {stats.setsByMuscleGroup.map((group) => (
            <li key={group.muscleGroup} className="flex items-center gap-2 text-sm">
              <span className="w-20 shrink-0">
                {MUSCLE_LABELS[group.muscleGroup] ?? group.muscleGroup}
              </span>
              <div className="h-3 flex-1 rounded bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-3 rounded bg-zinc-900 dark:bg-zinc-100"
                  style={{ width: `${(group.sets / maxSets) * 100}%` }}
                />
              </div>
              <span className="w-8 text-right text-zinc-500">{group.sets}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
