'use client';

import { DiaryDay, localToday } from '@/features/diary/diary-day';

export default function AppHome() {
  return <DiaryDay date={localToday()} />;
}
