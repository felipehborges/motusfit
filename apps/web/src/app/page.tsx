export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold tracking-tight">MotusFit</h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Alimentação e treino em um só lugar.
      </p>
      <div className="flex gap-3">
        <a href="/login" className="rounded border border-zinc-300 px-4 py-2 dark:border-zinc-700">
          Entrar
        </a>
        <a
          href="/signup"
          className="rounded bg-zinc-900 px-4 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Criar conta
        </a>
      </div>
    </main>
  );
}
