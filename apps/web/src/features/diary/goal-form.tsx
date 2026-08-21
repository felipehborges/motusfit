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
      <button type="button" className="mf-btn mf-btn-secondary" onClick={() => setOpen(true)}>
        {goal ? 'Editar meta' : 'Definir meta'}
      </button>
    );
  }

  return (
    <form
      className="mf-goal-form"
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
        <label key={key} className="mf-field">
          {label}
          <input
            type="number"
            min="1"
            step="any"
            className="mf-input w-24"
            value={values[key]}
            onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            required
          />
        </label>
      ))}
      <button type="submit" disabled={setGoal.isPending} className="mf-btn">
        Salvar
      </button>
      <button type="button" className="mf-btn mf-btn-ghost" onClick={() => setOpen(false)}>
        cancelar
      </button>
    </form>
  );
}
