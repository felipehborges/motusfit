'use client';

import { localToday } from '@/features/diary/diary-day';
import { WeeklyStats } from '@/features/stats/weekly-stats';

export default function StatsPage() {
  return <WeeklyStats date={localToday()} />;
}
