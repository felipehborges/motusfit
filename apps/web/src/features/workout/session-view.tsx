'use client';

import type { Exercise, SessionDetail, WorkoutSet } from '@motusfit/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Clock3, Dumbbell, Minus, Plus, Search, Trash2, X } from 'lucide-react';
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
  const restTimer = useRestTimer(sessionId);
  const [exerciseDefaults, setExerciseDefaults] = useState<
    Record<string, { weight: string; reps: string }>
  >({});

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: api.workout.sessions.get.key() });

  const finish = useMutation(
    api.workout.sessions.finish.mutationOptions({
      onSuccess: () => {
        // Sessão concluída muda o histórico — invalida antes de navegar de volta
        queryClient.invalidateQueries({ queryKey: api.workout.sessions.history.key() });
        queryClient.invalidateQueries({ queryKey: api.stats.today.key() });
        queryClient.invalidateQueries({ queryKey: api.stats.weekly.key() });
        onFinished();
      },
    }),
  );
  const cancel = useMutation(
    api.workout.sessions.cancel.mutationOptions({
      onSuccess: () => {
        restTimer.skip();
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
        description="Confirme cada série e deixe o MotusFit cuidar do descanso."
        action={
          !readOnly ? (
            <div className="mf-session-actions">
              {session.routineId === null && (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={cancel.isPending || finish.isPending}
                  onClick={() => {
                    if (
                      window.confirm(
                        'Cancelar este treino livre? As séries registradas serão apagadas.',
                      )
                    ) {
                      cancel.mutate({ id: session.id });
                    }
                  }}
                >
                  <X size={16} /> {cancel.isPending ? 'Cancelando…' : 'Cancelar treino'}
                </Button>
              )}
              <Button
                type="button"
                disabled={finish.isPending || cancel.isPending}
                onClick={() => finish.mutate({ id: session.id })}
              >
                <Check size={16} /> Concluir treino
              </Button>
            </div>
          ) : (
            <Badge className="bg-primary text-primary-foreground">
              <Check size={12} /> Finalizado
            </Badge>
          )
        }
      />
      <div className="mf-session-metrics">
        <Metric
          label="Duração"
          value={<SessionDuration startedAt={session.startedAt} finishedAt={session.finishedAt} />}
        />
        <Metric label="Volume" value={Math.round(session.volumeKg)} unit="kg" tone="blue" />
        <Metric label="Séries" value={session.totalSets} unit="concluídas" tone="lime" />
      </div>
      {finish.isError && (
        <p className="mf-save-status error" role="alert">
          Não foi possível concluir o treino. Verifique a conexão e tente novamente.
        </p>
      )}
      {cancel.isError && (
        <p className="mf-save-status error" role="alert">
          Não foi possível cancelar o treino. Verifique a conexão e tente novamente.
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
            targetReps={plan.targetRepsMin}
            readOnly={readOnly}
            onChanged={invalidate}
            onRestStart={restTimer.start}
            defaults={exerciseDefaults[plan.exercise.id]}
          />
        ))}

        {!readOnly && (
          <AddExercise
            onChanged={invalidate}
            onConfigured={(exerciseId, defaults) =>
              setExerciseDefaults((current) => ({ ...current, [exerciseId]: defaults }))
            }
            session={session}
          />
        )}
      </div>
      {!readOnly && restTimer.remaining > 0 && (
        <RestTimerDock
          remaining={restTimer.remaining}
          onAdjust={restTimer.adjust}
          onSkip={restTimer.skip}
        />
      )}
    </div>
  );
}

function ExerciseBlock({
  session,
  exercise,
  restSeconds,
  targetSets,
  targetReps,
  readOnly,
  onChanged,
  onRestStart,
  defaults,
}: {
  session: SessionDetail;
  exercise: Exercise;
  restSeconds: number;
  targetSets: number | null;
  targetReps: number | null;
  readOnly: boolean;
  onChanged: () => void;
  onRestStart: (seconds: number) => void;
  defaults?: { weight: string; reps: string } | undefined;
}) {
  const sets = session.sets.filter((s) => s.exerciseId === exercise.id);
  const [extraRows, setExtraRows] = useState(0);
  const [saved, setSaved] = useState(false);
  const lastSetsQuery = useQuery({
    ...api.workout.sessions.lastSets.queryOptions({ input: { exerciseId: exercise.id } }),
    enabled: !readOnly,
  });
  const hasPrevious = (lastSetsQuery.data?.length ?? 0) > 0;

  const removeSet = useMutation(
    api.workout.sessions.removeSet.mutationOptions({ onSuccess: onChanged }),
  );

  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 2000);
    return () => window.clearTimeout(timer);
  }, [saved]);

  const pendingRows =
    targetSets === null ? 1 + extraRows : Math.max(0, targetSets + extraRows - sets.length);

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
      <div
        className={`mf-set-table-head${hasPrevious ? '' : ' mf-set-table-no-previous'}`}
        aria-hidden="true"
      >
        <span>Série</span>
        {hasPrevious && <span>Último treino</span>}
        <span>Carga</span>
        <span>Reps</span>
        <span>
          <Check size={15} />
        </span>
      </div>
      <ol className="mf-set-list">
        {sets.map((set, index) => (
          <li
            key={set.id}
            className={`mf-set-row-complete${hasPrevious ? '' : ' mf-set-table-no-previous'}`}
          >
            <span className="mf-set-number">{index + 1}</span>
            {hasPrevious && (
              <span className="mf-set-previous">{formatPrevious(lastSetsQuery.data?.[index])}</span>
            )}
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
        {!readOnly &&
          Array.from({ length: pendingRows }).map((_, offset) => {
            const index = sets.length + offset;
            return (
              <DraftSetRow
                key={`${exercise.id}-${index}`}
                index={index}
                isNext={offset === 0}
                sessionId={session.id}
                exerciseId={exercise.id}
                previous={lastSetsQuery.data?.[index] ?? lastSetsQuery.data?.at(-1)}
                showPrevious={hasPrevious}
                defaultWeight={defaults?.weight}
                defaultReps={defaults?.reps ?? (targetReps ? String(targetReps) : '')}
                restSeconds={restSeconds}
                onAdded={() => {
                  setSaved(true);
                  onChanged();
                }}
                onRestStart={onRestStart}
              />
            );
          })}
      </ol>
      {!readOnly && (
        <div className="mf-set-footer">
          {saved && <span className="mf-save-status success">Salvo</span>}
          <button type="button" onClick={() => setExtraRows((value) => value + 1)}>
            <Plus size={16} /> Adicionar série
          </button>
        </div>
      )}
    </Card>
  );
}

function DraftSetRow({
  index,
  isNext,
  sessionId,
  exerciseId,
  previous,
  showPrevious,
  defaultWeight,
  defaultReps,
  restSeconds,
  onAdded,
  onRestStart,
}: {
  index: number;
  isNext: boolean;
  sessionId: string;
  exerciseId: string;
  previous?: WorkoutSet | undefined;
  showPrevious: boolean;
  defaultWeight?: string | undefined;
  defaultReps?: string | undefined;
  restSeconds: number;
  onAdded: () => void;
  onRestStart: (seconds: number) => void;
}) {
  const [reps, setReps] = useState(previous ? String(previous.reps) : (defaultReps ?? ''));
  const [weight, setWeight] = useState(
    previous ? String(previous.weightKg) : (defaultWeight ?? ''),
  );
  const [retryPayload, setRetryPayload] = useState<{
    sessionId: string;
    exerciseId: string;
    reps: number;
    weightKg: number;
    restSeconds: number;
    completed: true;
    clientId: string;
  } | null>(null);

  useEffect(() => {
    if (!previous) return;
    setReps((value) => (value === '' ? String(previous.reps) : value));
    setWeight((value) => (value === '' ? String(previous.weightKg) : value));
  }, [previous]);

  const addSet = useMutation(
    api.workout.sessions.addSet.mutationOptions({
      onSuccess: () => {
        onRestStart(restSeconds);
        setRetryPayload(null);
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
    setRetryPayload(nextPayload);
    addSet.mutate(nextPayload);
  };

  return (
    <li className={`mf-set-row-draft${showPrevious ? '' : ' mf-set-table-no-previous'}`}>
      <span className="mf-set-number">{index + 1}</span>
      {showPrevious && <span className="mf-set-previous">{formatPrevious(previous)}</span>}
      <Input
        type="number"
        min="0"
        step="any"
        inputMode="decimal"
        aria-label={isNext ? 'Carga (kg)' : `Carga (kg) série ${index + 1}`}
        value={weight}
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => setWeight(event.target.value)}
      />
      <Input
        type="number"
        min="1"
        inputMode="numeric"
        aria-label={isNext ? 'Reps' : `Reps série ${index + 1}`}
        value={reps}
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => setReps(event.target.value)}
      />
      <button
        type="button"
        className="mf-set-check"
        aria-label={isNext ? 'Série feita' : `Concluir série ${index + 1}`}
        disabled={!isNext || addSet.isPending || reps === '' || weight === ''}
        onClick={() => submitSet(null)}
      >
        <Check size={18} />
      </button>
      {addSet.isError && (
        <span className="mf-save-status error" role="alert">
          Não salvou.
          <button type="button" onClick={() => submitSet()}>
            Tentar novamente
          </button>
        </span>
      )}
    </li>
  );
}

function formatPrevious(set?: WorkoutSet) {
  return set ? `${set.weightKg} kg × ${set.reps}` : '—';
}

function SessionDuration({
  startedAt,
  finishedAt,
}: {
  startedAt: string;
  finishedAt: string | null;
}) {
  const [now, setNow] = useState(() =>
    finishedAt === null ? Date.now() : new Date(finishedAt).getTime(),
  );

  useEffect(() => {
    if (finishedAt !== null) {
      setNow(new Date(finishedAt).getTime());
      return;
    }
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [finishedAt]);

  return formatClock(Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000)));
}

function useRestTimer(sessionId: string) {
  const storageKey = `motusfit:rest:${sessionId}`;
  const [restUntil, setRestUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(storageKey));
    if (Number.isFinite(stored) && stored > Date.now()) setRestUntil(stored);
  }, [storageKey]);

  useEffect(() => {
    if (restUntil === null) return;
    const tick = () => {
      const current = Date.now();
      setNow(current);
      if (current >= restUntil) {
        window.localStorage.removeItem(storageKey);
        setRestUntil(null);
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [restUntil, storageKey]);

  const setUntil = (until: number | null) => {
    setRestUntil(until);
    setNow(Date.now());
    if (until === null) window.localStorage.removeItem(storageKey);
    else window.localStorage.setItem(storageKey, String(until));
  };

  return {
    remaining: restUntil === null ? 0 : Math.max(0, Math.ceil((restUntil - now) / 1000)),
    start: (seconds: number) => {
      if (seconds > 0) setUntil(Date.now() + seconds * 1000);
    },
    adjust: (seconds: number) => {
      if (restUntil !== null) setUntil(Math.max(Date.now(), restUntil + seconds * 1000));
    },
    skip: () => setUntil(null),
  };
}

function RestTimerDock({
  remaining,
  onAdjust,
  onSkip,
}: {
  remaining: number;
  onAdjust: (seconds: number) => void;
  onSkip: () => void;
}) {
  return (
    <div className="mf-rest-dock" role="timer" aria-label={`Descanso: ${remaining} segundos`}>
      <button
        type="button"
        onClick={() => onAdjust(-15)}
        aria-label="Diminuir descanso em 15 segundos"
      >
        <Minus size={16} /> 15
      </button>
      <span className="mf-rest-timer">
        <Clock3 size={18} /> {formatClock(remaining)}
      </span>
      <button
        type="button"
        onClick={() => onAdjust(15)}
        aria-label="Aumentar descanso em 15 segundos"
      >
        <Plus size={16} /> 15
      </button>
      <Button type="button" onClick={onSkip}>
        Pular
      </Button>
    </div>
  );
}

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function AddExercise({
  session,
  onChanged,
  onConfigured,
}: {
  session: SessionDetail;
  onChanged: () => void;
  onConfigured: (exerciseId: string, defaults: { weight: string; reps: string }) => void;
}) {
  const [query, setQuery] = useState('');
  const [series, setSeries] = useState('3');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('10');
  const searchQuery = useQuery({
    ...api.workout.exercises.search.queryOptions({ input: { query, limit: 10 } }),
    enabled: query.length > 0,
  });
  const addExercise = useMutation(
    api.workout.sessions.addExercise.mutationOptions({ onSuccess: onChanged }),
  );

  const existing = new Set(session.exercises.map((e) => e.id));
  const configurationIsValid =
    Number.isInteger(Number(series)) &&
    Number(series) >= 1 &&
    Number(series) <= 20 &&
    weight !== '' &&
    Number(weight) >= 0 &&
    reps !== '' &&
    Number.isInteger(Number(reps)) &&
    Number(reps) >= 1 &&
    Number(reps) <= 100;

  return (
    <div className="mf-add-exercise">
      <div>
        <Plus size={18} />
        <div>
          <strong>Adicionar exercício</strong>
          <span>Busque na biblioteca do MotusFit</span>
        </div>
      </div>
      <div className="mf-add-exercise-defaults">
        <label htmlFor="exercise-series">
          <span>Séries</span>
          <Input
            type="number"
            id="exercise-series"
            min="1"
            max="20"
            inputMode="numeric"
            aria-label="Número de séries"
            value={series}
            onChange={(event) => setSeries(event.target.value)}
          />
        </label>
        <label htmlFor="exercise-weight">
          <span>Carga para todas (kg)</span>
          <Input
            type="number"
            id="exercise-weight"
            min="0"
            step="any"
            inputMode="decimal"
            aria-label="Carga para todas as séries (kg)"
            placeholder="Ex.: 50"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
          />
        </label>
        <label htmlFor="exercise-reps">
          <span>Reps para todas</span>
          <Input
            type="number"
            id="exercise-reps"
            min="1"
            max="100"
            inputMode="numeric"
            aria-label="Repetições para todas as séries"
            value={reps}
            onChange={(event) => setReps(event.target.value)}
          />
        </label>
      </div>
      <label htmlFor="exercise-search">
        <Search size={15} />
        <Input
          id="exercise-search"
          aria-label="Nome do exercício"
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
                  disabled={!configurationIsValid || addExercise.isPending}
                  onClick={() => {
                    onConfigured(exercise.id, { weight, reps });
                    addExercise.mutate({
                      sessionId: session.id,
                      exerciseId: exercise.id,
                      targetSets: Number(series),
                      targetReps: Number(reps),
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
