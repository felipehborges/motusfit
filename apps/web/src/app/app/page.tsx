'use client';

import { TodayCard } from '@/features/dashboard/today-card';
import { DiaryDay, localToday } from '@/features/diary/diary-day';

export default function AppHome() {
  const date = localToday();
  return (
    <>
      <TodayCard date={date} />
      <DiaryDay date={date} />
    </>
  );
}
