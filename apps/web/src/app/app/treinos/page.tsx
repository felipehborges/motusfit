'use client';

import type { Routine } from '@motusfit/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  Dumbbell,
  Edit3,
  Flame,
  Plus,
  Trash2,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card, PageHeader, SectionHeader, StatusPill } from '@/components/ui';
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
    <div>
      <PageHeader
        eyebrow="Centro de treino"
        title="Construa sua força."
        description="Rotinas objetivas, progressão visível e zero distrações na hora de treinar."
        action={
          <button type="button" className="mf-btn" onClick={() => setEditing('new')}>
            <Plus size={16} /> Nova rotina
          </button>
        }
      />

      <Card className="mf-workout-hero">
        <div className="mf-workout-hero-icon">
          <Zap size={24} fill="currentColor" />
        </div>
        <div>
          <StatusPill tone="success">Pronto para começar</StatusPill>
          <h2>Treino livre</h2>
          <p>Entre no modo treino agora e escolha os exercícios durante a sessão.</p>
        </div>
        <button
          type="button"
          className="mf-btn"
          disabled={startSession.isPending}
          onClick={() => startSession.mutate({})}
        >
          <Dumbbell size={16} /> Iniciar agora
        </button>
      </Card>

      {editing !== null && (
        <div className="mf-editor-wrap">
          <RoutineForm routine={editing === 'new' ? undefined : editing} onDone={invalidate} />
        </div>
      )}

      <section className="mf-section-block">
        <SectionHeader
          eyebrow="Biblioteca"
          title="Minhas rotinas"
          description="Planos prontos para manter a consistência."
        />
        {routinesQuery.isPending && <p className="mf-loading">Carregando rotinas…</p>}
        <div className="mf-routine-grid">
          {(routinesQuery.data ?? []).map((routine, index) => (
            <Card key={routine.id} className="mf-routine-card">
              <div className="mf-routine-number">{String(index + 1).padStart(2, '0')}</div>
              <span className="mf-routine-icon">
                <Dumbbell size={21} />
              </span>
              <h3>{routine.name}</h3>
              <p>
                {routine.exercises.map((e) => e.exercise.name).join(' · ') ||
                  'Adicione exercícios para começar'}
              </p>
              <div className="mf-routine-meta">
                <span>
                  <Flame size={13} /> {routine.exercises.length} exercícios
                </span>
                <span>
                  <Clock3 size={13} /> ~45 min
                </span>
              </div>
              <div className="mf-routine-actions">
                <button
                  type="button"
                  className="mf-btn"
                  onClick={() => startSession.mutate({ routineId: routine.id })}
                >
                  Iniciar <ChevronRight size={15} />
                </button>
                <button
                  type="button"
                  className="mf-icon-btn"
                  aria-label={`Editar ${routine.name}`}
                  onClick={() => setEditing(routine)}
                >
                  <Edit3 size={15} />
                </button>
                <button
                  type="button"
                  className="mf-icon-btn danger"
                  aria-label={`Excluir ${routine.name}`}
                  onClick={() => removeRoutine.mutate({ id: routine.id })}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </Card>
          ))}
        </div>
        {routinesQuery.data?.length === 0 && editing === null && (
          <div className="mf-empty">Nenhuma rotina ainda. Crie seu primeiro plano de treino.</div>
        )}
      </section>

      <section className="mf-section-block">
        <SectionHeader
          eyebrow="Histórico"
          title="Atividade recente"
          description="Cada sessão é uma linha na sua evolução."
        />
        <Card className="mf-history-card">
          {(historyQuery.data?.sessions ?? []).map((session) => (
            <button
              key={session.id}
              type="button"
              className="mf-history-row"
              onClick={() => router.push(`/app/treinos/sessao/${session.id}`)}
            >
              <span className="mf-history-date">
                <CalendarDays size={17} />
              </span>
              <span className="mf-history-main">
                <strong>{session.title}</strong>
                <small>{new Date(session.startedAt).toLocaleDateString('pt-BR')}</small>
              </span>
              <span className="mf-history-stats">
                <b>{session.totalSets}</b> séries <b>{Math.round(session.volumeKg)}</b> kg
              </span>
              <StatusPill tone={session.finishedAt === null ? 'warning' : 'success'}>
                {session.finishedAt === null ? 'Em andamento' : 'Concluído'}
              </StatusPill>
              <ChevronRight size={16} />
            </button>
          ))}
          {historyQuery.data?.sessions.length === 0 && (
            <div className="mf-empty">Nenhum treino registrado. Seu histórico começa hoje.</div>
          )}
        </Card>
      </section>
    </div>
  );
}
