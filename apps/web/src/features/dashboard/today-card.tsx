'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, CalendarCheck2, Dumbbell, Target, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'peito',
  back: 'costas',
  shoulders: 'ombros',
  biceps: 'bíceps',
  triceps: 'tríceps',
  legs: 'pernas',
  glutes: 'glúteos',
  core: 'core',
  other: 'outros grupos',
};

export function TodayCard({ date }: { date: string }) {
  const statsQuery = useQuery(api.stats.today.queryOptions({ input: { date } }));
  const weeklyQuery = useQuery(api.stats.weekly.queryOptions({ input: { date } }));

  if (statsQuery.isError || weeklyQuery.isError)
    return <div className="mf-save-status error">Não foi possível carregar seu resumo.</div>;
  if (!statsQuery.data || !weeklyQuery.data)
    return <div className="mf-loading">Preparando seu resumo…</div>;
  const stats = statsQuery.data;
  const weekly = weeklyQuery.data;
  const volume = Math.round(weekly.totalVolumeKg).toLocaleString('pt-BR');
  const topMuscleGroup = weekly.setsByMuscleGroup.toSorted((a, b) => b.sets - a.sets)[0];

  return (
    <div className="mf-dashboard-grid">
      <Card className="mf-energy-card">
        <div className="mf-energy-copy">
          <Badge className="bg-primary text-primary-foreground">
            <Activity size={12} /> {stats.workoutSessions > 0 ? 'Feito por hoje' : 'Próximo passo'}
          </Badge>
          <h2>Construa sua força.</h2>
          <p>Registre seu treino, acompanhe o volume e faça da consistência o seu progresso.</p>
          <div className="mf-energy-note" aria-live="polite">
            <Target size={16} />
            <span>
              {stats.workoutSessions > 0
                ? `${stats.workoutSessions} ${stats.workoutSessions === 1 ? 'sessão concluída' : 'sessões concluídas'} hoje.`
                : 'Nenhuma sessão concluída hoje. Sua rotina está a um clique.'}
            </span>
          </div>
          <Button asChild>
            <Link href="/app/treinos">
              <Dumbbell size={16} /> Ir para treinos
            </Link>
          </Button>
        </div>
        <div className="mf-session-counter">
          <span className="mf-session-counter-label">Consistência</span>
          <div className="mf-session-counter-value">
            <strong>{weekly.activeDays}</strong>
            <span>
              {weekly.activeDays === 1 ? 'dia ativo' : 'dias ativos'}
              <br />
              nesta semana
            </span>
          </div>
          <span className="mf-session-counter-foot">semana atual</span>
        </div>
      </Card>

      <Card className="mf-daily-performance">
        <div className="mf-performance-head">
          <div>
            <p className="mf-eyebrow">Seu ritmo</p>
            <h3>Resumo da semana</h3>
          </div>
          <TrendingUp size={20} />
        </div>
        <div className="mf-performance-metrics">
          <Card className="mf-metric mf-metric-lime">
            <CardContent className="p-0">
              <span className="mf-metric-label">Sessões</span>
              <strong>{weekly.workoutSessions}</strong>
            </CardContent>
          </Card>
          <Card className="mf-metric mf-metric-blue">
            <CardContent className="p-0">
              <span className="mf-metric-label">Volume</span>
              <strong>{volume}</strong>
              <span className="mf-metric-unit">kg</span>
            </CardContent>
          </Card>
        </div>
        <div className="mf-streak-row">
          <CalendarCheck2 size={16} />
          <span>
            {topMuscleGroup
              ? `${topMuscleGroup.sets} séries de ${MUSCLE_LABELS[topMuscleGroup.muscleGroup] ?? topMuscleGroup.muscleGroup}, seu grupo mais treinado.`
              : 'Conclua uma série para começar a enxergar sua evolução.'}
          </span>
        </div>
      </Card>
    </div>
  );
}
