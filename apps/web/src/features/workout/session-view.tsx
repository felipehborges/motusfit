'use client';

import type { Exercise, SessionDetail } from '@motusfit/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Clock3, Dumbbell, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, Metric, PageHeader, StatusPill } from '@/components/ui';
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

  if (sessionQuery.isPending) return <p className="mf-loading">Preparando sua sessão…</p>;
  if (sessionQuery.isError) return <p className="text-red-400">Sessão não encontrada.</p>;

  const session = sessionQuery.data;
  const readOnly = session.finishedAt !== null;

  return (
    <div>
      <PageHeader
        eyebrow={readOnly ? 'Treino concluído' : 'Sessão em andamento'}
        title={session.title}
        description="Registre cada série. O progresso mora nos detalhes."
        action={
          !readOnly ? (
            <button
              type="button"
              disabled={finish.isPending}
              className="mf-btn"
              onClick={() => finish.mutate({ id: session.id })}
            >
              <Check size={16} /> Concluir treino
            </button>
          ) : (
            <StatusPill tone="success">
              <Check size={12} /> Finalizado
            </StatusPill>
          )
        }
      />
      <div className="mf-session-metrics">
        <Metric label="Volume" value={Math.round(session.volumeKg)} unit="kg" tone="blue" />
        <Metric label="Séries" value={session.totalSets} unit="concluídas" tone="lime" />
        <Metric
          label="Gasto estimado"
          value={session.estimatedKcal != null ? Math.round(session.estimatedKcal) : '—'}
          unit="kcal"
          tone="orange"
        />
      </div>
      <div className="mf-session-list">
        {session.exercises.map((exercise) => (
          <ExerciseBlock
            key={exercise.id}
            session={session}
            exercise={exercise}
            readOnly={readOnly}
            onChanged={invalidate}
          />
        ))}

        {session.exercises.length === 0 && (
          <div className="mf-empty">Adicione um exercício para começar a sessão.</div>
        )}

        {!readOnly && <AddExercise onChanged={invalidate} session={session} />}
      </div>
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
    <Card className="mf-exercise-block">
      <div className="mf-exercise-head">
        <span>
          <Dumbbell size={19} />
        </span>
        <div>
          <p className="mf-eyebrow">Exercício</p>
          <h3>{exercise.name}</h3>
        </div>
        <StatusPill>{sets.length} séries</StatusPill>
      </div>
      <ol className="mf-set-list">
        {sets.map((set, index) => (
          <li key={set.id}>
            <span className="mf-set-number">{String(index + 1).padStart(2, '0')}</span>
            <span>
              <strong>{set.weightKg}</strong>
              <small>kg</small>
            </span>
            <span>
              <strong>{set.reps}</strong>
              <small>reps</small>
            </span>
            <Check size={15} />
            {!readOnly && (
              <button
                type="button"
                className="mf-entry-remove"
                aria-label="Remover série"
                onClick={() => removeSet.mutate({ sessionId: session.id, setId: set.id })}
              >
                <Trash2 size={14} />
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
    </Card>
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
      className="mf-set-form"
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
      <label className="mf-field">
        Reps
        <input
          type="number"
          min="1"
          className="mf-input w-24"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          required
        />
      </label>
      <label className="mf-field">
        Carga (kg)
        <input
          type="number"
          min="0"
          step="any"
          className="mf-input w-28"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          required
        />
      </label>
      <button type="submit" disabled={addSet.isPending} className="mf-btn">
        <Check size={15} /> Série feita
      </button>
      {resting > 0 && (
        <span className="mf-rest-timer">
          <Clock3 size={14} /> {resting}s
        </span>
      )}
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
    <div className="mf-add-exercise">
      <div>
        <Plus size={18} />
        <div>
          <strong>Adicionar exercício</strong>
          <span>Busque na biblioteca do MotusFit</span>
        </div>
      </div>
      <label>
        <Search size={15} />
        <input
          placeholder="Nome do exercício…"
          className="mf-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      {query.length > 0 && (
        <ul className="mf-exercise-results">
          {(searchQuery.data ?? [])
            .filter((exercise) => !existing.has(exercise.id))
            .map((exercise) => (
              <li key={exercise.id}>
                <button
                  type="button"
                  className="mf-food-result"
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
                  <Dumbbell size={14} /> {exercise.name}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
