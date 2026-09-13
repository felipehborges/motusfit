'use client';

import type { Exercise, SessionDetail } from '@motusfit/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Clock3, Dumbbell, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Metric, PageHeader } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
            <Button
              type="button"
              disabled={finish.isPending}
              onClick={() => finish.mutate({ id: session.id })}
            >
              <Check size={16} /> Concluir treino
            </Button>
          ) : (
            <Badge className="bg-primary text-primary-foreground">
              <Check size={12} /> Finalizado
            </Badge>
          )
        }
      />
      <div className="mf-session-metrics">
        <Metric label="Volume" value={Math.round(session.volumeKg)} unit="kg" tone="blue" />
        <Metric label="Séries" value={session.totalSets} unit="concluídas" tone="lime" />
      </div>
      {finish.isError && (
        <p className="mf-save-status error" role="alert">
          Não foi possível concluir o treino. Verifique a conexão e tente novamente.
        </p>
      )}
      <div className="mf-session-list">
        {session.exercisePlans.map((plan) => (
          <ExerciseBlock
            key={plan.id}
            session={session}
            exercise={plan.exercise}
            restSeconds={plan.restSeconds}
            targetSets={plan.targetSets}
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
  restSeconds,
  targetSets,
  readOnly,
  onChanged,
}: {
  session: SessionDetail;
  exercise: Exercise;
  restSeconds: number;
  targetSets: number | null;
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
        <Badge variant="secondary">
          {sets.length}
          {targetSets === null ? '' : `/${targetSets}`} séries
        </Badge>
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
          restSeconds={restSeconds}
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
  restSeconds,
  onAdded,
}: {
  sessionId: string;
  exerciseId: string;
  suggestedReps?: number | undefined;
  suggestedWeight?: number | undefined;
  restSeconds: number;
  onAdded: () => void;
}) {
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const timerKey = `motusfit:rest:${sessionId}:${exerciseId}`;
  const [restUntil, setRestUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [retryPayload, setRetryPayload] = useState<{
    sessionId: string;
    exerciseId: string;
    reps: number;
    weightKg: number;
    restSeconds: number;
    completed: true;
    clientId: string;
  } | null>(null);
  const [saved, setSaved] = useState(false);

  // Sugestão da última sessão pré-preenche uma única vez (docs/product.md fluxo 2)
  useEffect(() => {
    if (suggestedReps !== undefined) setReps((v) => (v === '' ? String(suggestedReps) : v));
    if (suggestedWeight !== undefined) setWeight((v) => (v === '' ? String(suggestedWeight) : v));
  }, [suggestedReps, suggestedWeight]);

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(timerKey));
    if (Number.isFinite(stored) && stored > Date.now()) setRestUntil(stored);
  }, [timerKey]);

  useEffect(() => {
    if (restUntil === null) return;
    const tick = () => {
      const current = Date.now();
      setNow(current);
      if (current >= restUntil) {
        window.localStorage.removeItem(timerKey);
        setRestUntil(null);
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [restUntil, timerKey]);

  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 2000);
    return () => window.clearTimeout(timer);
  }, [saved]);

  const addSet = useMutation(
    api.workout.sessions.addSet.mutationOptions({
      onSuccess: () => {
        const until = Date.now() + restSeconds * 1000;
        if (restSeconds > 0) {
          window.localStorage.setItem(timerKey, String(until));
          setNow(Date.now());
          setRestUntil(until);
        }
        setRetryPayload(null);
        setSaved(true);
        onAdded();
      },
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
    }),
  );

  const submitSet = (payload = retryPayload) => {
    const nextPayload =
      payload ??
      ({
        sessionId,
        exerciseId,
        reps: Number(reps),
        weightKg: Number(weight),
        restSeconds,
        completed: true,
        clientId: crypto.randomUUID(),
      } as const);
    setSaved(false);
    setRetryPayload(nextPayload);
    addSet.mutate(nextPayload);
  };

  const resting = restUntil === null ? 0 : Math.max(0, Math.ceil((restUntil - now) / 1000));

  return (
    <form
      className="mf-set-form"
      onSubmit={(e) => {
        e.preventDefault();
        submitSet(null);
      }}
    >
      <label className="mf-field" htmlFor={`${sessionId}-${exerciseId}-reps`}>
        Reps
        <Input
          type="number"
          id={`${sessionId}-${exerciseId}-reps`}
          min="1"
          className="w-24"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          required
        />
      </label>
      <label className="mf-field" htmlFor={`${sessionId}-${exerciseId}-weight`}>
        Carga (kg)
        <Input
          type="number"
          id={`${sessionId}-${exerciseId}-weight`}
          min="0"
          step="any"
          className="w-28"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          required
        />
      </label>
      <Button type="submit" disabled={addSet.isPending}>
        <Check size={15} /> {addSet.isPending ? 'Salvando…' : 'Série feita'}
      </Button>
      {saved && <span className="mf-save-status success">Salvo</span>}
      {addSet.isError && (
        <span className="mf-save-status error" role="alert">
          Não salvou.
          <button type="button" onClick={() => submitSet()}>
            Tentar novamente
          </button>
        </span>
      )}
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
  const addExercise = useMutation(
    api.workout.sessions.addExercise.mutationOptions({ onSuccess: onChanged }),
  );

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
      <label htmlFor="exercise-search">
        <Search size={15} />
        <Input
          id="exercise-search"
          placeholder="Nome do exercício…"
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
                    addExercise.mutate({
                      sessionId: session.id,
                      exerciseId: exercise.id,
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
      {addExercise.isError && (
        <p className="mf-save-status error" role="alert">
          Não foi possível adicionar o exercício.
        </p>
      )}
    </div>
  );
}
