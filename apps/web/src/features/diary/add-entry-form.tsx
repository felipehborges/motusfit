'use client';

import type { Food, MealSlot } from '@motusfit/contracts';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, Search, X } from 'lucide-react';
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
      <button type="button" onClick={() => setOpen(true)} className="mf-add-food">
        <Plus size={14} /> Adicionar alimento
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
        className="mf-inline-form"
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
        <strong className="text-sm">{selected.name}</strong>
        <label className="mf-field">
          Quantidade ({selected.servingUnit === 'unit' ? 'un' : selected.servingUnit})
          <input
            type="number"
            min="0.1"
            step="any"
            className="mf-input w-24"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={addEntry.isPending} className="mf-btn">
          Adicionar
        </button>
        <button type="button" className="mf-btn mf-btn-ghost" onClick={() => setSelected(null)}>
          voltar
        </button>
      </form>
    );
  }

  const foods = query === '' ? (recentQuery.data ?? searchQuery.data) : searchQuery.data;

  return (
    <div className="mf-food-picker">
      <div className="mf-search-row">
        <span>
          <Search size={15} />
        </span>
        <input
          placeholder="Buscar alimento…"
          className="mf-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" className="mf-btn mf-btn-secondary" onClick={() => setCreating(true)}>
          novo alimento
        </button>
        <button
          type="button"
          aria-label="Fechar"
          className="mf-btn mf-btn-ghost"
          onClick={() => setOpen(false)}
        >
          <X size={15} />
        </button>
      </div>
      <ul className="mf-food-results">
        {(foods ?? []).map((food) => (
          <li key={food.id}>
            <button type="button" className="mf-food-result" onClick={() => setSelected(food)}>
              {food.isFavorite ? '★ ' : ''}
              {food.name}
              <span>
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
