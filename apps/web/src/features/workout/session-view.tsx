'use client';

import type { Exercise, SessionDetail } from '@motusfit/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export function SessionView({
  sessionId,
  onFinished,
}: {
  sessionId: string;
  onFinished: () => void;
}) {
  const queryClient = useQueryClient();
  const sessionQuery = useQuery(
    api.workout.sessions.get.queryOptions({ input: { id: sessionId } }),
  );

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: api.workout.sessions.get.key() });

  const finish = useMutation(
    api.workout.sessions.finish.mutationOptions({
      onSuccess: () => {
        // Sessão concluída muda o histórico — invalida antes de navegar de volta
        queryClient.invalidateQueries({ queryKey: api.workout.sessions.history.key() });
        onFinished();
      },
    }),
  );

  if (sessionQuery.isPending) return <p>Carregando sessão…</p>;
  if (sessionQuery.isError) return <p className="text-red-600">Sessão não encontrada.</p>;

  const session = sessionQuery.data;
  const readOnly = session.finishedAt !== null;

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{session.title}</h2>
          <p className="text-sm text-zinc-500">
            {Math.round(session.volumeKg)} kg de volume · {session.totalSets} séries
            {session.estimatedKcal != null && ` · ~${Math.round(session.estimatedKcal)} kcal`}
          </p>
        </div>
        {!readOnly && (
          <button
            type="button"
            disabled={finish.isPending}
            className="rounded bg-zinc-900 px-3 py-1 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            onClick={() => finish.mutate({ id: session.id })}
          >
            Concluir treino
          </button>
        )}
      </div>

      {session.exercises.map((exercise) => (
        <ExerciseBlock
          key={exercise.id}
          session={session}
          exercise={exercise}
          readOnly={readOnly}
          onChanged={invalidate}
        />
      ))}

      {!readOnly && <AddExercise onChanged={invalidate} session={session} />}
    </div>
  );
}

function ExerciseBlock({
  session,
  exercise,
  readOnly,
  onChanged,
}: {
  session: SessionDetail;
  exercise: Exercise;
  readOnly: boolean;
  onChanged: () => void;
}) {
  const sets = session.sets.filter((s) => s.exerciseId === exercise.id);
  const lastSetsQuery = useQuery({
    ...api.workout.sessions.lastSets.queryOptions({ input: { exerciseId: exercise.id } }),
    enabled: !readOnly,
  });
  const suggestion = lastSetsQuery.data?.[sets.length] ?? lastSetsQuery.data?.at(-1);

  const removeSet = useMutation(
    api.workout.sessions.removeSet.mutationOptions({ onSuccess: onChanged }),
  );

  return (
    <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h3 className="font-semibold">{exercise.name}</h3>
      <ol className="mt-2 flex flex-col gap-1">
        {sets.map((set, index) => (
          <li key={set.id} className="flex items-center justify-between text-sm">
            <span>
              #{index + 1} — {set.reps} reps × {set.weightKg} kg
            </span>
            {!readOnly && (
              <button
                type="button"
                className="text-red-600 underline"
                onClick={() => removeSet.mutate({ sessionId: session.id, setId: set.id })}
              >
                remover
              </button>
            )}
          </li>
        ))}
      </ol>
      {!readOnly && (
        <SetForm
          sessionId={session.id}
          exerciseId={exercise.id}
          suggestedReps={suggestion?.reps}
          suggestedWeight={suggestion?.weightKg}
          onAdded={onChanged}
        />
      )}
    </section>
  );
}

function SetForm({
  sessionId,
  exerciseId,
  suggestedReps,
  suggestedWeight,
  onAdded,
}: {
  sessionId: string;
  exerciseId: string;
  suggestedReps?: number | undefined;
  suggestedWeight?: number | undefined;
  onAdded: () => void;
}) {
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [resting, setResting] = useState(0);

  // Sugestão da última sessão pré-preenche uma única vez (docs/product.md fluxo 2)
  useEffect(() => {
    if (suggestedReps !== undefined) setReps((v) => (v === '' ? String(suggestedReps) : v));
    if (suggestedWeight !== undefined) setWeight((v) => (v === '' ? String(suggestedWeight) : v));
  }, [suggestedReps, suggestedWeight]);

  useEffect(() => {
    if (resting <= 0) return;
    const timer = setTimeout(() => setResting((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [resting]);

  const addSet = useMutation(
    api.workout.sessions.addSet.mutationOptions({
      onSuccess: () => {
        setResting(90);
        onAdded();
      },
    }),
  );

  return (
    <form
      className="mt-2 flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        addSet.mutate({
          sessionId,
          exerciseId,
          reps: Number(reps),
          weightKg: Number(weight),
          completed: true,
          clientId: crypto.randomUUID(),
        });
      }}
    >
      <label className="flex flex-col text-xs">
        Reps
        <input
          type="number"
          min="1"
          className="w-20 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          required
        />
      </label>
      <label className="flex flex-col text-xs">
        Carga (kg)
        <input
          type="number"
          min="0"
          step="any"
          className="w-24 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          required
        />
      </label>
      <button
        type="submit"
        disabled={addSet.isPending}
        className="rounded bg-zinc-900 px-3 py-1 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        ✓ Série feita
      </button>
      {resting > 0 && <span className="text-sm text-zinc-500">descanso: {resting}s</span>}
    </form>
  );
}

function AddExercise({ session, onChanged }: { session: SessionDetail; onChanged: () => void }) {
  const [query, setQuery] = useState('');
  const searchQuery = useQuery({
    ...api.workout.exercises.search.queryOptions({ input: { query, limit: 10 } }),
    enabled: query.length > 0,
  });
  const addSet = useMutation(api.workout.sessions.addSet.mutationOptions({ onSuccess: onChanged }));

  const existing = new Set(session.exercises.map((e) => e.id));

  return (
    <div className="rounded-lg border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
      <input
        placeholder="Adicionar exercício à sessão…"
        className="w-full rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query.length > 0 && (
        <ul className="mt-1">
          {(searchQuery.data ?? [])
            .filter((exercise) => !existing.has(exercise.id))
            .map((exercise) => (
              <li key={exercise.id}>
                <button
                  type="button"
                  className="w-full rounded px-2 py-1 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  onClick={() => {
                    // Primeiro set "âncora" adiciona o exercício à sessão
                    addSet.mutate({
                      sessionId: session.id,
                      exerciseId: exercise.id,
                      reps: 1,
                      weightKg: 0,
                      completed: false,
                      clientId: crypto.randomUUID(),
                    });
                    setQuery('');
                  }}
                >
                  {exercise.name}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
