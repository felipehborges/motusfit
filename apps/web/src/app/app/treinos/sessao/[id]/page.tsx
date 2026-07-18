'use client';

import { useParams, useRouter } from 'next/navigation';
import { SessionView } from '@/features/workout/session-view';

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  return <SessionView sessionId={id} onFinished={() => router.push('/app/treinos')} />;
}
