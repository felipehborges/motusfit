'use client';

import type { NutritionGoal } from '@motusfit/contracts';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';

const FIELDS = [
  ['kcal', 'kcal'],
  ['proteinG', 'Proteína (g)'],
  ['carbsG', 'Carbo (g)'],
  ['fatG', 'Gordura (g)'],
] as const;

export function GoalForm({
  goal,
  date,
  onSaved,
}: {
  goal: NutritionGoal | null;
  date: string;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({
    kcal: goal ? String(goal.kcal) : '2000',
    proteinG: goal ? String(goal.proteinG) : '150',
    carbsG: goal ? String(goal.carbsG) : '200',
    fatG: goal ? String(goal.fatG) : '60',
  });

  const setGoal = useMutation(
    api.nutrition.goals.set.mutationOptions({
      onSuccess: () => {
        setOpen(false);
        onSaved();
      },
    }),
  );

  if (!open) {
    return (
      <button type="button" className="text-sm underline" onClick={() => setOpen(true)}>
        {goal ? 'Editar meta' : 'Definir meta'}
      </button>
    );
  }

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setGoal.mutate({
          date,
          kcal: Number(values.kcal),
          proteinG: Number(values.proteinG),
          carbsG: Number(values.carbsG),
          fatG: Number(values.fatG),
        });
      }}
    >
      {FIELDS.map(([key, label]) => (
        <label key={key} className="flex flex-col text-xs">
          {label}
          <input
            type="number"
            min="1"
            step="any"
            className="w-20 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={values[key]}
            onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            required
          />
        </label>
      ))}
      <button
        type="submit"
        disabled={setGoal.isPending}
        className="rounded bg-zinc-900 px-3 py-1 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        Salvar
      </button>
      <button type="button" className="text-sm underline" onClick={() => setOpen(false)}>
        cancelar
      </button>
    </form>
  );
}
