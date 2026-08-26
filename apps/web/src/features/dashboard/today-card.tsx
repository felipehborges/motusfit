'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Dumbbell, Target, Trophy } from 'lucide-react';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { Card, Metric, StatusPill } from '@/components/ui';
import { api } from '@/lib/api';

export function TodayCard({ date }: { date: string }) {
  const statsQuery = useQuery(api.stats.today.queryOptions({ input: { date } }));

  if (!statsQuery.data) return <div className="mf-loading">Preparando seu resumo…</div>;
  const stats = statsQuery.data;

  return (
    <div className="mf-dashboard-grid">
      <Card className="mf-energy-card">
        <div className="mf-energy-copy">
          <StatusPill tone="success">
            <Activity size={12} /> Foco do dia
          </StatusPill>
          <h2>Construa sua força.</h2>
          <p>Registre seu treino, acompanhe o volume e faça da consistência o seu progresso.</p>
          <div className="mf-energy-balance">
            <strong>{stats.workoutSessions}</strong>
            <span>
              treino{stats.workoutSessions === 1 ? '' : 's'} concluído
              {stats.workoutSessions === 1 ? '' : 's'} hoje
            </span>
          </div>
          <Link href="/app/treinos" className="mf-btn">
            <Dumbbell size={16} /> Ir para treinos
          </Link>
        </div>
        <div className="mf-progress-ring" style={{ '--progress': '220deg' } as CSSProperties}>
          <div>
            <Dumbbell size={22} />
            <strong>{stats.workoutSessions}</strong>
            <span>sessões hoje</span>
          </div>
        </div>
      </Card>

      <Card className="mf-daily-performance">
        <div className="mf-performance-head">
          <div>
            <p className="mf-eyebrow">Performance</p>
            <h3>Movimento de hoje</h3>
          </div>
          <Trophy size={20} />
        </div>
        <div className="mf-performance-metrics">
          <Metric label="Treinos" value={stats.workoutSessions} tone="lime" />
          <Metric label="Próximo passo" value="Treinar" tone="blue" />
        </div>
        <div className="mf-streak-row">
          <Target size={16} />
          <span>
            {stats.workoutSessions > 0
              ? 'Sessão concluída. Excelente trabalho!'
              : 'Seu próximo treino começa com uma decisão.'}
          </span>
        </div>
      </Card>
    </div>
  );
}
