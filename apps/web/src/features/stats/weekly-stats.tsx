'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Dumbbell, Flame, TrendingUp } from 'lucide-react';
import { Card, Metric, PageHeader, SectionHeader, StatusPill } from '@/components/ui';
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
const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export function WeeklyStats({ date }: { date: string }) {
  const statsQuery = useQuery(api.stats.weekly.queryOptions({ input: { date } }));
  if (statsQuery.isPending) return <p className="mf-loading">Calculando sua evolução…</p>;
  if (statsQuery.isError) return <p className="text-red-400">Erro ao carregar estatísticas.</p>;

  const stats = statsQuery.data;
  const maxKcal = Math.max(...stats.kcalByDay.map((d) => d.kcal), 1);
  const maxSets = Math.max(...stats.setsByMuscleGroup.map((g) => g.sets), 1);
  const activeDays = stats.kcalByDay.filter((day) => day.kcal > 0).length;

  return (
    <div>
      <PageHeader
        eyebrow="Análise semanal"
        title="Evolução em números."
        description="Entenda o que você fez, onde está avançando e qual é o próximo movimento."
        action={
          <StatusPill tone="success">
            <TrendingUp size={12} /> Semana ativa
          </StatusPill>
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
        <Metric
          label="Energia de treino"
          value={Math.round(stats.workoutKcal)}
          unit="kcal"
          tone="orange"
        />
        <Metric label="Dias registrados" value={activeDays} unit="de 7" />
      </div>

      <div className="mf-stats-grid">
        <Card className="mf-chart-card mf-kcal-chart">
          <SectionHeader
            eyebrow="Nutrição"
            title="Calorias por dia"
            description={`Semana iniciada em ${stats.weekStart}`}
            action={<Flame size={19} />}
          />
          <div className="mf-bar-chart" role="img" aria-label="Gráfico de calorias por dia">
            {stats.kcalByDay.map((day, index) => {
              const height = Math.max((day.kcal / maxKcal) * 100, day.kcal > 0 ? 5 : 2);
              return (
                <div key={day.date} className="mf-bar-column">
                  <span className="mf-bar-value">{day.kcal > 0 ? Math.round(day.kcal) : ''}</span>
                  <div className="mf-bar-track">
                    <div className="mf-bar-fill" style={{ height: `${height}%` }} />
                  </div>
                  <span>{WEEKDAY_LABELS[index]}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="mf-chart-card">
          <SectionHeader
            eyebrow="Distribuição"
            title="Grupos musculares"
            description="Séries concluídas na semana"
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
