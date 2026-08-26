'use client';

import { PageHeader } from '@/components/ui';
import { TodayCard } from '@/features/dashboard/today-card';
import { localToday } from '@/lib/date';

export default function AppHome() {
  const date = localToday();
  return (
    <div>
      <PageHeader
        eyebrow="Resumo diário"
        title="Seu treino, hoje."
        description="Foque no próximo movimento, registre suas séries e acompanhe sua evolução."
      />
      <TodayCard date={date} />
    </div>
  );
}
