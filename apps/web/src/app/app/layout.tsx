'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { signOut, useSession } from '@/lib/auth-client';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace('/login');
    }
  }, [isPending, session, router]);

  if (isPending || !session) {
    return <main className="flex min-h-screen items-center justify-center">Carregando…</main>;
  }

  const linkClass = (href: string) =>
    `rounded px-3 py-1 text-sm ${
      pathname === href ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'underline'
    }`;

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 p-8">
      <header className="flex w-full max-w-2xl items-center justify-between">
        <nav className="flex items-center gap-2">
          <span className="mr-2 font-bold">MotusFit</span>
          <Link href="/app" className={linkClass('/app')}>
            Diário
          </Link>
          <Link href="/app/treinos" className={linkClass('/app/treinos')}>
            Treinos
          </Link>
        </nav>
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
      {children}
    </div>
  );
}
