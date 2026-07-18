'use client';

import type { Exercise, MuscleGroup, Routine } from '@motusfit/contracts';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';

type PlannedExercise = {
  exercise: Exercise;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  restSeconds: number;
};

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
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

export function RoutineForm({
  routine,
  onDone,
}: {
  routine?: Routine | undefined;
  onDone: () => void;
}) {
  const [name, setName] = useState(routine?.name ?? '');
  const [items, setItems] = useState<PlannedExercise[]>(
    routine?.exercises.map((e) => ({
      exercise: e.exercise,
      targetSets: e.targetSets,
      targetRepsMin: e.targetRepsMin,
      targetRepsMax: e.targetRepsMax,
      restSeconds: e.restSeconds,
    })) ?? [],
  );
  const [query, setQuery] = useState('');
  const [showNewExercise, setShowNewExercise] = useState(false);

  const searchQuery = useQuery({
    ...api.workout.exercises.search.queryOptions({ input: { query, limit: 10 } }),
    enabled: query.length > 0,
  });

  const createRoutine = useMutation(
    api.workout.routines.create.mutationOptions({ onSuccess: onDone }),
  );
  const updateRoutine = useMutation(
    api.workout.routines.update.mutationOptions({ onSuccess: onDone }),
  );
  const save = routine ? updateRoutine : createRoutine;

  function addExercise(exercise: Exercise) {
    if (items.some((i) => i.exercise.id === exercise.id)) return;
    setItems([
      ...items,
      { exercise, targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 90 },
    ]);
    setQuery('');
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
      onSubmit={(e) => {
        e.preventDefault();
        const payload = {
          name,
          exercises: items.map((i) => ({
            exerciseId: i.exercise.id,
            targetSets: i.targetSets,
            targetRepsMin: i.targetRepsMin,
            targetRepsMax: i.targetRepsMax,
            restSeconds: i.restSeconds,
          })),
        };
        if (routine) {
          updateRoutine.mutate({ id: routine.id, ...payload });
        } else {
          createRoutine.mutate(payload);
        }
      }}
    >
      <label className="flex flex-col gap-1 text-sm">
        Nome da rotina
        <input
          className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={120}
        />
      </label>

      <ul className="flex flex-col gap-2">
        {items.map((item, index) => (
          <li key={item.exercise.id} className="flex flex-wrap items-end gap-2 text-sm">
            <span className="min-w-40 font-medium">{item.exercise.name}</span>
            {(
              [
                ['targetSets', 'séries'],
                ['targetRepsMin', 'reps mín'],
                ['targetRepsMax', 'reps máx'],
                ['restSeconds', 'descanso (s)'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex flex-col text-xs">
                {label}
                <input
                  type="number"
                  min={key === 'restSeconds' ? 0 : 1}
                  className="w-20 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                  value={item[key]}
                  onChange={(e) =>
                    setItems(
                      items.map((it, i) =>
                        i === index ? { ...it, [key]: Number(e.target.value) } : it,
                      ),
                    )
                  }
                  required
                />
              </label>
            ))}
            <button
              type="button"
              className="text-xs text-red-600 underline"
              onClick={() => setItems(items.filter((_, i) => i !== index))}
            >
              remover
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2">
        <input
          placeholder="Buscar exercício…"
          className="flex-1 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="button"
          className="text-sm underline"
          onClick={() => setShowNewExercise(true)}
        >
          novo exercício
        </button>
      </div>
      {query.length > 0 && (
        <ul>
          {(searchQuery.data ?? []).map((exercise) => (
            <li key={exercise.id}>
              <button
                type="button"
                className="w-full rounded px-2 py-1 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => addExercise(exercise)}
              >
                {exercise.name}
                <span className="text-zinc-500"> — {MUSCLE_LABELS[exercise.muscleGroup]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {showNewExercise && (
        <NewExerciseForm
          onDone={(exercise) => {
            setShowNewExercise(false);
            if (exercise) addExercise(exercise);
          }}
        />
      )}

      {save.isError && <p className="text-sm text-red-600">Erro ao salvar a rotina.</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={save.isPending || items.length === 0}
          className="rounded bg-zinc-900 px-3 py-1 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {routine ? 'Salvar alterações' : 'Criar rotina'}
        </button>
        <button type="button" className="text-sm underline" onClick={onDone}>
          cancelar
        </button>
      </div>
    </form>
  );
}

function NewExerciseForm({ onDone }: { onDone: (exercise: Exercise | null) => void }) {
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('chest');
  const create = useMutation(
    api.workout.exercises.create.mutationOptions({ onSuccess: (exercise) => onDone(exercise) }),
  );

  return (
    <div className="flex flex-wrap items-end gap-2 rounded border border-dashed border-zinc-300 p-2 dark:border-zinc-700">
      <label className="flex flex-col text-xs">
        Nome do exercício
        <input
          className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={200}
        />
      </label>
      <label className="flex flex-col text-xs">
        Grupo muscular
        <select
          className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          value={muscleGroup}
          onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
        >
          {Object.entries(MUSCLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled={create.isPending || name.length === 0}
        className="rounded bg-zinc-900 px-3 py-1 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        onClick={() => create.mutate({ name, muscleGroup, equipment: null })}
      >
        Criar
      </button>
      <button type="button" className="text-sm underline" onClick={() => onDone(null)}>
        cancelar
      </button>
      {create.isError && <p className="w-full text-xs text-red-600">Erro (nome duplicado?).</p>}
    </div>
  );
}
