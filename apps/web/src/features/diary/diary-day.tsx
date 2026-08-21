'use client';

import type { DiaryEntry, MealSlot } from '@motusfit/contracts';
import { roundMacrosForDisplay } from '@motusfit/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Apple, Coffee, Moon, Sandwich, Trash2 } from 'lucide-react';
import { Card, Metric, SectionHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { AddEntryForm } from './add-entry-form';
import { GoalForm } from './goal-form';

const SLOTS: { slot: MealSlot; label: string }[] = [
  { slot: 'breakfast', label: 'Café da manhã' },
  { slot: 'lunch', label: 'Almoço' },
  { slot: 'dinner', label: 'Jantar' },
  { slot: 'snack', label: 'Lanches' },
];

const SLOT_META = {
  breakfast: { icon: Coffee, note: 'Comece com energia' },
  lunch: { icon: Apple, note: 'Recarregue o seu dia' },
  dinner: { icon: Moon, note: 'Feche o dia com equilíbrio' },
  snack: { icon: Sandwich, note: 'Pequenas escolhas contam' },
} as const;

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

  if (dayQuery.isPending) return <p className="mf-loading">Carregando diário…</p>;
  if (dayQuery.isError) return <p className="text-red-400">Erro ao carregar o diário.</p>;

  const day = dayQuery.data;
  const totals = roundMacrosForDisplay(day.totals);

  return (
    <div className="mf-diary">
      <Card className="mf-macro-card">
        <SectionHeader
          eyebrow="Nutrição"
          title="Seus macros"
          description={`Acompanhamento de ${new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}`}
          action={<GoalForm goal={day.goal} date={date} onSaved={invalidateDay} />}
        />
        <div className="mf-macro-grid">
          <Metric
            label="Calorias"
            value={totals.kcal}
            unit={`/ ${day.goal?.kcal ?? '—'} kcal`}
            tone="lime"
          />
          <Metric
            label="Proteínas"
            value={totals.proteinG}
            unit={`/ ${day.goal?.proteinG ?? '—'} g`}
            tone="blue"
          />
          <Metric
            label="Carboidratos"
            value={totals.carbsG}
            unit={`/ ${day.goal?.carbsG ?? '—'} g`}
            tone="orange"
          />
          <Metric label="Gorduras" value={totals.fatG} unit={`/ ${day.goal?.fatG ?? '—'} g`} />
        </div>
      </Card>

      <SectionHeader
        eyebrow="Diário alimentar"
        title="Refeições do dia"
        description="Registre o que comeu sem perder o fluxo."
      />
      <div className="mf-meal-grid">
        {SLOTS.map(({ slot, label }) => {
          const entries = day.entries.filter((e) => e.mealSlot === slot);
          const Icon = SLOT_META[slot].icon;
          return (
            <Card key={slot} className="mf-meal-card">
              <div className="mf-meal-head">
                <span className="mf-meal-icon">
                  <Icon size={18} />
                </span>
                <div>
                  <h3>{label}</h3>
                  <p>{SLOT_META[slot].note}</p>
                </div>
                <strong>
                  {Math.round(entries.reduce((sum, item) => sum + item.macros.kcal, 0))}
                  <small> kcal</small>
                </strong>
              </div>
              <ul className="mf-entry-list">
                {entries.length === 0 && (
                  <li className="mf-empty-meal">Nenhum alimento registrado ainda.</li>
                )}
                {entries.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    onRemove={() => removeEntry.mutate({ id: entry.id })}
                  />
                ))}
              </ul>
              <AddEntryForm date={date} mealSlot={slot} onAdded={invalidateDay} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function EntryRow({ entry, onRemove }: { entry: DiaryEntry; onRemove: () => void }) {
  const macros = roundMacrosForDisplay(entry.macros);
  return (
    <li className="mf-entry-row">
      <span className="mf-entry-bullet" />
      <span className="mf-entry-name">
        <strong>{entry.food.name}</strong>
        <small>
          {entry.quantity} {entry.food.servingUnit === 'unit' ? 'un' : entry.food.servingUnit} · P{' '}
          {macros.proteinG} · C {macros.carbsG} · G {macros.fatG}
        </small>
      </span>
      <span className="mf-entry-kcal">{macros.kcal} kcal</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remover ${entry.food.name}`}
        className="mf-entry-remove"
      >
        <Trash2 size={14} />
      </button>
    </li>
  );
}
