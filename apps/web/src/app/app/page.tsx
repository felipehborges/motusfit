'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DiaryDay, localToday } from '@/features/diary/diary-day';
import { signOut, useSession } from '@/lib/auth-client';

export default function AppHome() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace('/login');
    }
  }, [isPending, session, router]);

  if (isPending || !session) {
    return <main className="flex min-h-screen items-center justify-center">Carregando…</main>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 p-8">
      <header className="flex w-full max-w-2xl items-center justify-between">
        <h1 className="text-2xl font-bold">Diário — {session.user.name}</h1>
        <button
          type="button"
          className="rounded border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700"
          onClick={async () => {
            await signOut();
            router.replace('/login');
          }}
        >
          Sair
        </button>
      </header>
      <DiaryDay date={localToday()} />
    </main>
  );
}
