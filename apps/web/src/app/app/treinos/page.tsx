'use client';

import type { Routine } from '@motusfit/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RoutineForm } from '@/features/workout/routine-form';
import { api } from '@/lib/api';

export default function WorkoutsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Routine | 'new' | null>(null);

  const routinesQuery = useQuery(api.workout.routines.list.queryOptions());
  const historyQuery = useQuery(
    api.workout.sessions.history.queryOptions({ input: { limit: 10 } }),
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: api.workout.routines.list.key() });
    setEditing(null);
  };

  const removeRoutine = useMutation(
    api.workout.routines.remove.mutationOptions({ onSuccess: invalidate }),
  );
  const startSession = useMutation(
    api.workout.sessions.start.mutationOptions({
      onSuccess: (session) => router.push(`/app/treinos/sessao/${session.id}`),
    }),
  );

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Rotinas</h2>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700"
              onClick={() => startSession.mutate({})}
            >
              Treino livre
            </button>
            <button
              type="button"
              className="rounded bg-zinc-900 px-3 py-1 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
              onClick={() => setEditing('new')}
            >
              Nova rotina
            </button>
          </div>
        </div>

        {editing !== null && (
          <RoutineForm routine={editing === 'new' ? undefined : editing} onDone={invalidate} />
        )}

        {routinesQuery.isPending && <p>Carregando rotinas…</p>}
        {(routinesQuery.data ?? []).map((routine) => (
          <div
            key={routine.id}
            className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div>
              <p className="font-medium">{routine.name}</p>
              <p className="text-sm text-zinc-500">
                {routine.exercises.map((e) => e.exercise.name).join(' · ') || 'Sem exercícios'}
              </p>
            </div>
            <div className="flex gap-2 text-sm">
              <button
                type="button"
                className="rounded bg-zinc-900 px-3 py-1 text-white dark:bg-zinc-100 dark:text-zinc-900"
                onClick={() => startSession.mutate({ routineId: routine.id })}
              >
                Iniciar
              </button>
              <button type="button" className="underline" onClick={() => setEditing(routine)}>
                editar
              </button>
              <button
                type="button"
                className="text-red-600 underline"
                onClick={() => removeRoutine.mutate({ id: routine.id })}
              >
                excluir
              </button>
            </div>
          </div>
        ))}
        {routinesQuery.data?.length === 0 && editing === null && (
          <p className="text-sm text-zinc-500">Nenhuma rotina ainda — crie a primeira.</p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Histórico</h2>
        {(historyQuery.data?.sessions ?? []).map((session) => (
          <button
            key={session.id}
            type="button"
            className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 text-left text-sm dark:border-zinc-800"
            onClick={() => router.push(`/app/treinos/sessao/${session.id}`)}
          >
            <span>
              <span className="font-medium">{session.title}</span>
              <span className="text-zinc-500"> — {session.startedAt.slice(0, 10)}</span>
            </span>
            <span className="text-zinc-500">
              {session.totalSets} séries · {Math.round(session.volumeKg)} kg
              {session.estimatedKcal != null && ` · ~${Math.round(session.estimatedKcal)} kcal`}
              {session.finishedAt === null && ' · em andamento'}
            </span>
          </button>
        ))}
        {historyQuery.data?.sessions.length === 0 && (
          <p className="text-sm text-zinc-500">Nenhum treino registrado.</p>
        )}
      </section>
    </div>
  );
}
