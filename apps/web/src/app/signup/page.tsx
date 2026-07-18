import Link from 'next/link';
import { AuthForm } from '@/features/auth/auth-form';

export const metadata = { title: 'Criar conta — MotusFit' };

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold">Criar conta</h1>
      <AuthForm mode="signup" />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Já tem conta?{' '}
        <Link href="/login" className="underline">
          Entrar
        </Link>
      </p>
    </main>
  );
}
