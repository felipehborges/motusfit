'use client';

import type { Food, MealSlot } from '@motusfit/contracts';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { FoodForm } from './food-form';

export function AddEntryForm({
  date,
  mealSlot,
  onAdded,
}: {
  date: string;
  mealSlot: MealSlot;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [creating, setCreating] = useState(false);

  const searchQuery = useQuery({
    ...api.nutrition.foods.search.queryOptions({ input: { query, limit: 10 } }),
    enabled: open && !selected,
  });
  const recentQuery = useQuery({
    ...api.nutrition.foods.recent.queryOptions(),
    enabled: open && !selected && query === '',
  });

  const addEntry = useMutation(
    api.nutrition.diary.add.mutationOptions({
      onSuccess: () => {
        setOpen(false);
        setSelected(null);
        setQuery('');
        onAdded();
      },
    }),
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 text-sm text-zinc-600 underline dark:text-zinc-400"
      >
        + Adicionar alimento
      </button>
    );
  }

  if (creating) {
    return (
      <FoodForm
        onDone={(food) => {
          setCreating(false);
          if (food) setSelected(food);
        }}
      />
    );
  }

  if (selected) {
    return (
      <form
        className="mt-2 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          addEntry.mutate({
            date,
            mealSlot,
            foodId: selected.id,
            quantity: Number(quantity),
            clientId: crypto.randomUUID(),
          });
        }}
      >
        <span className="text-sm">{selected.name}</span>
        <label className="flex flex-col text-xs">
          Quantidade ({selected.servingUnit === 'unit' ? 'un' : selected.servingUnit})
          <input
            type="number"
            min="0.1"
            step="any"
            className="w-24 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          disabled={addEntry.isPending}
          className="rounded bg-zinc-900 px-3 py-1 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Adicionar
        </button>
        <button type="button" className="text-sm underline" onClick={() => setSelected(null)}>
          voltar
        </button>
      </form>
    );
  }

  const foods = query === '' ? (recentQuery.data ?? searchQuery.data) : searchQuery.data;

  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          placeholder="Buscar alimento…"
          className="flex-1 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" className="text-sm underline" onClick={() => setCreating(true)}>
          novo alimento
        </button>
        <button type="button" className="text-sm underline" onClick={() => setOpen(false)}>
          fechar
        </button>
      </div>
      <ul className="flex flex-col">
        {(foods ?? []).map((food) => (
          <li key={food.id}>
            <button
              type="button"
              className="w-full rounded px-2 py-1 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => setSelected(food)}
            >
              {food.isFavorite ? '★ ' : ''}
              {food.name}
              <span className="text-zinc-500">
                {' '}
                — {food.kcal} kcal / {food.servingSize}
                {food.servingUnit === 'unit' ? ' un' : food.servingUnit}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
