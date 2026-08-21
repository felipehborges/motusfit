'use client';

import { roundMacrosForDisplay } from '@motusfit/core';
import { useQuery } from '@tanstack/react-query';
import { Activity, Flame, Target, Trophy } from 'lucide-react';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { Card, Metric, StatusPill } from '@/components/ui';
import { api } from '@/lib/api';

export function TodayCard({ date }: { date: string }) {
  const statsQuery = useQuery(api.stats.today.queryOptions({ input: { date } }));

  if (!statsQuery.data) return <div className="mf-loading">Preparando seu resumo…</div>;
  const stats = statsQuery.data;
  const consumed = roundMacrosForDisplay(stats.consumed);
  const progress = stats.goal
    ? Math.min(Math.round((consumed.kcal / stats.goal.kcal) * 100), 100)
    : 0;

  return (
    <div className="mf-dashboard-grid">
      <Card className="mf-energy-card">
        <div className="mf-energy-copy">
          <StatusPill tone="success">
            <Activity size={12} /> Meta diária
          </StatusPill>
          <h2>Energia em equilíbrio</h2>
          <p>Você está construindo o dia refeição por refeição. Mantenha o ritmo.</p>
          <div className="mf-energy-balance">
            <strong>
              {stats.remainingKcal == null ? '—' : Math.abs(Math.round(stats.remainingKcal))}
            </strong>
            <span>
              {stats.remainingKcal != null && stats.remainingKcal < 0
                ? 'kcal acima'
                : 'kcal restantes'}
            </span>
          </div>
          <Link href="/app/treinos" className="mf-btn">
            Ver meus treinos
          </Link>
        </div>
        <div
          className="mf-progress-ring"
          style={{ '--progress': `${progress * 3.6}deg` } as CSSProperties}
        >
          <div>
            <Flame size={22} />
            <strong>{consumed.kcal}</strong>
            <span>de {stats.goal?.kcal ?? '—'} kcal</span>
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
          <Metric
            label="Queima estimada"
            value={Math.round(stats.workoutKcal)}
            unit="kcal"
            tone="orange"
          />
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
