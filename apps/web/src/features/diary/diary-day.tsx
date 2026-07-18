'use client';

import type { DiaryEntry, MealSlot } from '@motusfit/contracts';
import { roundMacrosForDisplay } from '@motusfit/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AddEntryForm } from './add-entry-form';
import { GoalForm } from './goal-form';

const SLOTS: { slot: MealSlot; label: string }[] = [
  { slot: 'breakfast', label: 'Café da manhã' },
  { slot: 'lunch', label: 'Almoço' },
  { slot: 'dinner', label: 'Jantar' },
  { slot: 'snack', label: 'Lanches' },
];

export function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;
}

export function DiaryDay({ date }: { date: string }) {
  const queryClient = useQueryClient();
  const dayQuery = useQuery(api.nutrition.diary.listByDay.queryOptions({ input: { date } }));

  const invalidateDay = () =>
    queryClient.invalidateQueries({ queryKey: api.nutrition.diary.listByDay.key() });

  const removeEntry = useMutation(
    api.nutrition.diary.remove.mutationOptions({ onSuccess: invalidateDay }),
  );

  if (dayQuery.isPending) return <p>Carregando diário…</p>;
  if (dayQuery.isError) return <p className="text-red-600">Erro ao carregar o diário.</p>;

  const day = dayQuery.data;
  const totals = roundMacrosForDisplay(day.totals);

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Hoje ({date})</h2>
          <GoalForm goal={day.goal} date={date} onSaved={invalidateDay} />
        </div>
        <dl className="mt-2 grid grid-cols-4 gap-2 text-center">
          {(
            [
              ['kcal', totals.kcal, day.goal?.kcal],
              ['Proteína', totals.proteinG, day.goal?.proteinG],
              ['Carbo', totals.carbsG, day.goal?.carbsG],
              ['Gordura', totals.fatG, day.goal?.fatG],
            ] as const
          ).map(([label, value, goal]) => (
            <div key={label} className="rounded bg-zinc-50 p-2 dark:bg-zinc-900">
              <dt className="text-xs text-zinc-500">{label}</dt>
              <dd className="font-semibold">
                {value}
                {goal != null && <span className="text-xs text-zinc-500"> / {goal}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {SLOTS.map(({ slot, label }) => {
        const entries = day.entries.filter((e) => e.mealSlot === slot);
        return (
          <section
            key={slot}
            className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <h3 className="font-semibold">{label}</h3>
            <ul className="mt-2 flex flex-col gap-1">
              {entries.length === 0 && <li className="text-sm text-zinc-500">Nenhuma entrada.</li>}
              {entries.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  onRemove={() => removeEntry.mutate({ id: entry.id })}
                />
              ))}
            </ul>
            <AddEntryForm date={date} mealSlot={slot} onAdded={invalidateDay} />
          </section>
        );
      })}
    </div>
  );
}

function EntryRow({ entry, onRemove }: { entry: DiaryEntry; onRemove: () => void }) {
  const macros = roundMacrosForDisplay(entry.macros);
  return (
    <li className="flex items-center justify-between gap-2 text-sm">
      <span>
        {entry.food.name} — {entry.quantity}{' '}
        {entry.food.servingUnit === 'unit' ? 'un' : entry.food.servingUnit}
      </span>
      <span className="flex items-center gap-3 text-zinc-500">
        {macros.kcal} kcal · P {macros.proteinG} · C {macros.carbsG} · G {macros.fatG}
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remover ${entry.food.name}`}
          className="text-red-600 hover:underline"
        >
          remover
        </button>
      </span>
    </li>
  );
}
