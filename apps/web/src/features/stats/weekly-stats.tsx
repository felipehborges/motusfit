'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Dumbbell, TrendingUp } from 'lucide-react';
import { Metric, PageHeader, SectionHeader } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';

const MUSCLE_LABELS: Record<string, string> = {
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
export function WeeklyStats({ date }: { date: string }) {
  const statsQuery = useQuery(api.stats.weekly.queryOptions({ input: { date } }));
  if (statsQuery.isPending) return <p className="mf-loading">Calculando sua evolução…</p>;
  if (statsQuery.isError) return <p className="text-red-400">Erro ao carregar estatísticas.</p>;

  const stats = statsQuery.data;
  const maxSets = Math.max(...stats.setsByMuscleGroup.map((g) => g.sets), 1);

  return (
    <div>
      <PageHeader
        eyebrow="Análise semanal"
        title="Evolução em números."
        description="Entenda o que você fez, onde está avançando e qual é o próximo movimento."
        action={
          <Badge className="bg-primary text-primary-foreground">
            <TrendingUp size={12} /> Semana ativa
          </Badge>
        }
      />

      <div className="mf-stats-metrics">
        <Metric label="Sessões" value={stats.workoutSessions} unit="treinos" tone="lime" />
        <Metric
          label="Volume total"
          value={Math.round(stats.totalVolumeKg).toLocaleString('pt-BR')}
          unit="kg"
          tone="blue"
        />
        <Metric label="Dias registrados" value={stats.activeDays} unit="de 7" />
      </div>

      <div className="mf-stats-grid">
        <Card className="mf-chart-card">
          <SectionHeader
            eyebrow="Distribuição"
            title="Grupos musculares"
            description={`Séries concluídas desde ${stats.weekStart}`}
            action={<Dumbbell size={19} />}
          />
          {stats.setsByMuscleGroup.length === 0 && (
            <div className="mf-empty">Complete um treino para ver sua distribuição muscular.</div>
          )}
          <ul className="mf-muscle-list">
            {stats.setsByMuscleGroup.map((group) => (
              <li key={group.muscleGroup}>
                <div>
                  <span>{MUSCLE_LABELS[group.muscleGroup] ?? group.muscleGroup}</span>
                  <strong>{group.sets} séries</strong>
                </div>
                <div className="mf-muscle-track">
                  <div style={{ width: `${(group.sets / maxSets) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mf-insight-card">
        <span>
          <Activity size={22} />
        </span>
        <div>
          <p className="mf-eyebrow">Insight Motus</p>
          <h3>
            {stats.workoutSessions > 0
              ? 'A consistência já está acontecendo.'
              : 'Sua evolução começa no primeiro registro.'}
          </h3>
          <p>
            {stats.workoutSessions > 0
              ? `Você concluiu ${stats.workoutSessions} sessão nesta semana. Continue registrando para tornar sua progressão cada vez mais clara.`
              : 'Escolha uma rotina, conclua sua primeira sessão e volte aqui para acompanhar os resultados.'}
          </p>
        </div>
      </Card>
    </div>
  );
}
