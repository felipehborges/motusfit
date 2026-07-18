import Link from 'next/link';
import { AuthForm } from '@/features/auth/auth-form';

export const metadata = { title: 'Entrar — MotusFit' };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold">Entrar</h1>
      <AuthForm mode="login" />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Não tem conta?{' '}
        <Link href="/signup" className="underline">
          Criar conta
        </Link>
      </p>
    </main>
  );
}
