'use client';

import type { Exercise, MuscleGroup, Routine } from '@motusfit/contracts';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { DEMO_MODE } from '@/lib/mock-api';

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

const EXERCISE_IMAGE_ROOT =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

const EXERCISE_IMAGE_IDS: Record<string, string> = {
  'Supino Reto (barra)': 'Barbell_Bench_Press_-_Medium_Grip',
  'Supino Reto (halteres)': 'Dumbbell_Bench_Press',
  'Supino Inclinado (barra)': 'Barbell_Incline_Bench_Press_-_Medium_Grip',
  'Supino Inclinado (halteres)': 'Incline_Dumbbell_Press',
  'Supino Declinado (barra)': 'Decline_Barbell_Bench_Press',
  'Supino Declinado (halteres)': 'Decline_Dumbbell_Bench_Press',
  Crossover: 'Cable_Crossover',
  'Flexão de Braço': 'Push-Ups',
  'Barra Fixa': 'Pullups',
  'Puxada Frontal': 'Front_Lat_Pulldown',
  'Puxada Alta (pegada aberta)': 'Wide-Grip_Lat_Pulldown',
  'Remada Curvada (barra)': 'Bent_Over_Barbell_Row',
  'Remada Unilateral (halteres)': 'One-Arm_Dumbbell_Row',
  'Remada Baixa': 'Seated_Cable_Rows',
  'Levantamento Terra': 'Barbell_Deadlift',
  'Desenvolvimento Militar (barra)': 'Standing_Military_Press',
  'Desenvolvimento Arnold (halteres)': 'Arnold_Dumbbell_Press',
  'Elevação Lateral (halteres)': 'Side_Lateral_Raise',
  'Elevação Frontal (halteres)': 'Front_Dumbbell_Raise',
  'Elevação Posterior (halteres)': 'Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench',
  'Face Pull': 'Face_Pull',
  'Rosca Direta (barra)': 'Barbell_Curl',
  'Rosca Alternada (halteres)': 'Alternate_Hammer_Curl',
  'Rosca Martelo (halteres)': 'Hammer_Curls',
  'Tríceps Corda': 'Triceps_Pushdown',
  'Tríceps Testa (barra)': 'Lying_Triceps_Press',
  'Mergulho no Banco': 'Bench_Dips',
  'Supino Fechado': 'Close-Grip_Barbell_Bench_Press',
  'Agachamento Livre': 'Barbell_Squat',
  'Leg Press': 'Leg_Press',
  'Cadeira Extensora': 'Leg_Extensions',
  'Mesa Flexora': 'Lying_Leg_Curls',
  'Afundo (halteres)': 'Dumbbell_Lunges',
  'Agachamento Búlgaro (halteres)': 'Dumbbell_Bulgarian_Split_Squat',
  'Stiff (barra)': 'Romanian_Deadlift',
  'Hack Squat': 'Hack_Squat',
  'Elevação Pélvica (barra)': 'Barbell_Hip_Thrust',
  'Cadeira Abdutora': 'Hip_Abduction',
  'Abdominal Supra': 'Crunches',
  Prancha: 'Plank',
  'Elevação de Pernas': 'Hanging_Leg_Raise',
  'Abdominal na Máquina': 'Ab_Crunch_Machine',
  'Rotação de Tronco no Cabo': 'Cable_Russian_Twists',
};

const GROUP_FALLBACK_IMAGE_IDS: Record<MuscleGroup, string> = {
  chest: 'Barbell_Bench_Press_-_Medium_Grip',
  back: 'Bent_Over_Barbell_Row',
  shoulders: 'Standing_Military_Press',
  biceps: 'Barbell_Curl',
  triceps: 'Bench_Dips',
  legs: 'Barbell_Squat',
  glutes: 'Barbell_Hip_Thrust',
  core: 'Crunches',
  other: 'Bodyweight_Squat',
};

function imageUrl(imageId: string) {
  return `${EXERCISE_IMAGE_ROOT}${imageId}/0.jpg`;
}

function ExerciseThumbnail({
  exercise,
  size = 'card',
}: {
  exercise: Exercise;
  size?: 'card' | 'row';
}) {
  const fallbackUrl = imageUrl(GROUP_FALLBACK_IMAGE_IDS[exercise.muscleGroup]);
  return (
    <div
      className={
        size === 'card'
          ? 'aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-800'
          : 'h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800'
      }
    >
      {DEMO_MODE ? (
        <span className="grid h-full w-full place-items-center bg-primary text-center text-xs font-black text-primary-foreground">
          DEMO
          <br />
          {exercise.name}
        </span>
      ) : (
        // biome-ignore lint/performance/noImgElement: remote public-domain exercise demonstrations intentionally bypass Next image optimization.
        <img
          src={imageUrl(
            EXERCISE_IMAGE_IDS[exercise.name] ?? GROUP_FALLBACK_IMAGE_IDS[exercise.muscleGroup],
          )}
          alt={`Demonstração de ${exercise.name}`}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = fallbackUrl;
          }}
        />
      )}
    </div>
  );
}

function InputNumber({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex min-w-18 flex-1 flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
      {label}
      <input
        type="number"
        min={min}
        className="number-input h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100 dark:focus:ring-zinc-800"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        required
      />
    </label>
  );
}

export function RoutineForm({
  routine,
  onDone,
}: {
  routine?: Routine | undefined;
  onDone: () => void;
}) {
  const [name, setName] = useState(routine?.name ?? '');
  const [items, setItems] = useState<PlannedExercise[]>(
    routine?.exercises.map((exercise) => ({
      exercise: exercise.exercise,
      targetSets: exercise.targetSets,
      targetRepsMin: exercise.targetRepsMin,
      targetRepsMax: exercise.targetRepsMax,
      restSeconds: exercise.restSeconds,
    })) ?? [],
  );
  const [query, setQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | 'all'>('all');
  const [showNewExercise, setShowNewExercise] = useState(false);

  const searchQuery = useQuery(
    api.workout.exercises.search.queryOptions({
      input: {
        ...(query.trim() && { query: query.trim() }),
        ...(muscleFilter !== 'all' && { muscleGroup: muscleFilter }),
        limit: 12,
      },
    }),
  );

  const createRoutine = useMutation(
    api.workout.routines.create.mutationOptions({ onSuccess: onDone }),
  );
  const updateRoutine = useMutation(
    api.workout.routines.update.mutationOptions({ onSuccess: onDone }),
  );
  const save = routine ? updateRoutine : createRoutine;

  function addExercise(exercise: Exercise) {
    if (items.some((item) => item.exercise.id === exercise.id)) return;
    setItems([
      ...items,
      { exercise, targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 90 },
    ]);
  }

  function updateItem(
    index: number,
    key: Exclude<keyof PlannedExercise, 'exercise'>,
    value: number,
  ) {
    setItems(
      items.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)),
    );
  }

  return (
    <form
      className="mf-routine-form"
      onSubmit={(event) => {
        event.preventDefault();
        const payload = {
          name,
          exercises: items.map((item) => ({
            exerciseId: item.exercise.id,
            targetSets: item.targetSets,
            targetRepsMin: item.targetRepsMin,
            targetRepsMax: item.targetRepsMax,
            restSeconds: item.restSeconds,
          })),
        };
        if (routine) {
          updateRoutine.mutate({ id: routine.id, ...payload });
        } else {
          createRoutine.mutate(payload);
        }
      }}
    >
      <label className="flex flex-col gap-2 text-sm font-medium">
        Nome da rotina
        <input
          className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100 dark:focus:ring-zinc-800"
          placeholder="Ex.: Segunda — Peito e tríceps"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={120}
        />
      </label>

      <section className="flex flex-col gap-3" aria-labelledby="selected-exercises-heading">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h3 id="selected-exercises-heading" className="font-semibold">
              Seu treino
            </h3>
            <p className="text-sm text-zinc-500">Defina as séries, repetições e o descanso.</p>
          </div>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {items.length} {items.length === 1 ? 'exercício' : 'exercícios'}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 px-4 py-7 text-center text-sm text-zinc-500 dark:border-zinc-700">
            Escolha exercícios abaixo para montar seu treino.
          </div>
        ) : (
          <ol className="flex flex-col gap-3">
            {items.map((item, index) => (
              <li
                key={item.exercise.id}
                className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800 sm:flex-row"
              >
                <ExerciseThumbnail exercise={item.exercise} size="row" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.exercise.name}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {MUSCLE_LABELS[item.exercise.muscleGroup]} ·{' '}
                        {item.exercise.equipment ?? 'Sem equipamento'}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))}
                    >
                      Remover
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <InputNumber
                      label="Séries"
                      value={item.targetSets}
                      min={1}
                      onChange={(value) => updateItem(index, 'targetSets', value)}
                    />
                    <InputNumber
                      label="Reps mín."
                      value={item.targetRepsMin}
                      min={1}
                      onChange={(value) => updateItem(index, 'targetRepsMin', value)}
                    />
                    <InputNumber
                      label="Reps máx."
                      value={item.targetRepsMax}
                      min={1}
                      onChange={(value) => updateItem(index, 'targetRepsMax', value)}
                    />
                    <InputNumber
                      label="Descanso (s)"
                      value={item.restSeconds}
                      min={0}
                      onChange={(value) => updateItem(index, 'restSeconds', value)}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section
        className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900/70"
        aria-labelledby="exercise-picker-heading"
      >
        <div className="flex flex-col gap-3">
          <div>
            <h3 id="exercise-picker-heading" className="font-semibold">
              Adicionar exercício
            </h3>
            <p className="text-sm text-zinc-500">Veja a demonstração antes de incluir no treino.</p>
          </div>
          <input
            placeholder="Busque por nome, como supino ou agachamento"
            className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-100 dark:focus:ring-zinc-800"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              aria-pressed={muscleFilter === 'all'}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${muscleFilter === 'all' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-100 dark:bg-zinc-950 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-800'}`}
              onClick={() => setMuscleFilter('all')}
            >
              Todos
            </button>
            {(Object.keys(MUSCLE_LABELS) as MuscleGroup[]).map((group) => (
              <button
                key={group}
                type="button"
                aria-pressed={muscleFilter === group}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${muscleFilter === group ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-100 dark:bg-zinc-950 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-800'}`}
                onClick={() => setMuscleFilter(group)}
              >
                {MUSCLE_LABELS[group]}
              </button>
            ))}
          </div>
        </div>

        {searchQuery.isPending ? (
          <p className="py-8 text-center text-sm text-zinc-500">Carregando exercícios…</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(searchQuery.data ?? []).map((exercise) => {
              const selected = items.some((item) => item.exercise.id === exercise.id);
              return (
                <button
                  key={exercise.id}
                  type="button"
                  disabled={selected}
                  className="group overflow-hidden rounded-xl bg-white text-left shadow-sm ring-1 ring-zinc-200 transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-zinc-950 disabled:cursor-default disabled:opacity-45 dark:bg-zinc-950 dark:ring-zinc-700 dark:focus:ring-zinc-100"
                  onClick={() => addExercise(exercise)}
                >
                  <ExerciseThumbnail exercise={exercise} />
                  <span className="block p-3">
                    <span className="line-clamp-2 block text-sm font-semibold">
                      {exercise.name}
                    </span>
                    <span className="mt-1 block text-xs text-zinc-500">
                      {MUSCLE_LABELS[exercise.muscleGroup]} · {exercise.equipment ?? 'Livre'}
                    </span>
                    <span className="mt-3 block text-xs font-medium text-zinc-950 dark:text-zinc-50">
                      {selected ? 'Já adicionado' : 'Adicionar +'}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {!searchQuery.isPending && searchQuery.data?.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-500">Nenhum exercício encontrado.</p>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4 text-xs text-zinc-500 dark:border-zinc-800">
          <a
            href="https://github.com/yuhonas/free-exercise-db"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            Demonstrações: Free Exercise DB (domínio público)
          </a>
          <button
            type="button"
            className="font-medium underline underline-offset-2"
            onClick={() => setShowNewExercise(true)}
          >
            Não encontrou? Criar exercício
          </button>
        </div>

        {showNewExercise && (
          <NewExerciseForm
            onDone={(exercise) => {
              setShowNewExercise(false);
              if (exercise) addExercise(exercise);
            }}
          />
        )}
      </section>

      {save.isError && <p className="text-sm text-red-600">Erro ao salvar a rotina.</p>}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={save.isPending || items.length === 0}
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {routine ? 'Salvar alterações' : 'Criar rotina'}
        </button>
        <button type="button" className="px-3 py-2 text-sm font-medium underline" onClick={onDone}>
          Cancelar
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
    <div className="mf-new-exercise-form">
      <label className="flex min-w-48 flex-1 flex-col gap-1 text-xs font-medium">
        Nome do exercício
        <input
          className="h-10 rounded-lg border border-zinc-300 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={200}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium">
        Grupo muscular
        <select
          className="h-10 rounded-lg border border-zinc-300 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          value={muscleGroup}
          onChange={(event) => setMuscleGroup(event.target.value as MuscleGroup)}
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
        className="h-10 rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        onClick={() => create.mutate({ name, muscleGroup, equipment: null })}
      >
        Criar
      </button>
      <button type="button" className="h-10 px-2 text-sm underline" onClick={() => onDone(null)}>
        Cancelar
      </button>
      {create.isError && <p className="w-full text-xs text-red-600">Erro ao criar o exercício.</p>}
    </div>
  );
}
