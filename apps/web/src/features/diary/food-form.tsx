'use client';

import type { Food } from '@motusfit/contracts';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';

const FIELDS = [
  ['servingSize', 'Porção'],
  ['kcal', 'kcal'],
  ['proteinG', 'Proteína (g)'],
  ['carbsG', 'Carbo (g)'],
  ['fatG', 'Gordura (g)'],
] as const;

export function FoodForm({ onDone }: { onDone: (food: Food | null) => void }) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<'g' | 'ml' | 'unit'>('g');
  const [values, setValues] = useState({
    servingSize: '100',
    kcal: '',
    proteinG: '',
    carbsG: '',
    fatG: '',
  });

  const createFood = useMutation(
    api.nutrition.foods.create.mutationOptions({ onSuccess: (food) => onDone(food) }),
  );

  return (
    <form
      className="mf-food-create"
      onSubmit={(e) => {
        e.preventDefault();
        createFood.mutate({
          name,
          brand: null,
          servingUnit: unit,
          servingSize: Number(values.servingSize),
          kcal: Number(values.kcal),
          proteinG: Number(values.proteinG),
          carbsG: Number(values.carbsG),
          fatG: Number(values.fatG),
        });
      }}
    >
      <label className="mf-field">
        Nome
        <input
          className="mf-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={200}
        />
      </label>
      <label className="mf-field">
        Unidade
        <select
          className="mf-input"
          value={unit}
          onChange={(e) => setUnit(e.target.value as typeof unit)}
        >
          <option value="g">g</option>
          <option value="ml">ml</option>
          <option value="unit">unidade</option>
        </select>
      </label>
      {FIELDS.map(([key, label]) => (
        <label key={key} className="mf-field">
          {label}
          <input
            type="number"
            min="0"
            step="any"
            className="mf-input w-24"
            value={values[key]}
            onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            required
          />
        </label>
      ))}
      <button type="submit" disabled={createFood.isPending} className="mf-btn">
        Salvar alimento
      </button>
      <button type="button" className="mf-btn mf-btn-ghost" onClick={() => onDone(null)}>
        cancelar
      </button>
    </form>
  );
}
