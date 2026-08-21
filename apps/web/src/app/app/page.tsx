'use client';

import { PageHeader } from '@/components/ui';
import { TodayCard } from '@/features/dashboard/today-card';
import { DiaryDay, localToday } from '@/features/diary/diary-day';

export default function AppHome() {
  const date = localToday();
  return (
    <div>
      <PageHeader
        eyebrow="Resumo diário"
        title="Seu ritmo, hoje."
        description="Energia, nutrição e treino reunidos para você tomar decisões melhores ao longo do dia."
      />
      <TodayCard date={date} />
      <DiaryDay date={date} />
    </div>
  );
}
