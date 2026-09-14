'use client';

import { PageHeader } from '@/components/ui';
import { TodayCard } from '@/features/dashboard/today-card';
import { localToday } from '@/lib/date';

export default function AppHome() {
  const date = localToday();
  return (
    <div>
      <PageHeader
        eyebrow="Visão geral"
        title="Seu treino em perspectiva."
        description="Veja o ritmo da semana e siga direto para o próximo treino."
      />
      <TodayCard date={date} />
    </div>
  );
}
