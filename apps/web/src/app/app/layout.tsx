import Link from 'next/link';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center gap-6 p-8">
      <header className="flex w-full max-w-2xl items-center justify-between">
        <nav className="flex items-center gap-2">
          <span className="mr-2 font-bold">MotusFit</span>
          <Link href="/app" className="rounded px-3 py-1 text-sm underline">
            Diário
          </Link>
          <Link href="/app/treinos" className="rounded px-3 py-1 text-sm underline">
            Treinos
          </Link>
          <Link href="/app/estatisticas" className="rounded px-3 py-1 text-sm underline">
            Estatísticas
          </Link>
        </nav>
        <Link href="/app/perfil" className="rounded px-3 py-1 text-sm underline">
          Perfil
        </Link>
      </header>
      {children}
    </div>
  );
}
