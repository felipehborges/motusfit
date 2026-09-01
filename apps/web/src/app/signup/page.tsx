import Link from 'next/link';
import { AuthForm } from '@/features/auth/auth-form';

export const metadata = { title: 'Criar conta — MotusFit' };

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <p className="mb-3 text-sm font-semibold text-lime-300">MotusFit</p>
      <h1 className="text-3xl font-bold tracking-tight">Comece seu treino</h1>
      <p className="mb-8 mt-2 text-sm text-zinc-400">
        Crie sua conta para salvar sua evolução com segurança.
      </p>
      <AuthForm mode="signup" />
      <p className="mt-6 text-sm text-zinc-400">
        Já tem uma conta?{' '}
        <Link className="font-medium text-lime-300 hover:text-lime-200" href="/login">
          Entrar
        </Link>
      </p>
    </main>
  );
}
