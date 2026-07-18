'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
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
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">Olá, {session.user.name}</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Dashboard chega na Fase 5 — diário e treinos primeiro.
      </p>
      <button
        type="button"
        className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
        onClick={async () => {
          await signOut();
          router.replace('/login');
        }}
      >
        Sair
      </button>
    </main>
  );
}
