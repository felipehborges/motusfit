'use client';

import { WeeklyStats } from '@/features/stats/weekly-stats';
import { localToday } from '@/lib/date';

export default function StatsPage() {
  return <WeeklyStats date={localToday()} />;
}
