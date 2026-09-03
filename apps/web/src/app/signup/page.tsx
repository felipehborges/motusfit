import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { AuthForm } from '@/features/auth/auth-form';

export const metadata = { title: 'Criar conta — MotusFit' };

export default function SignupPage() {
  return (
    <main className="mf-auth-page">
      <Card className="mf-auth-card">
        <CardContent className="p-7 sm:p-10">
          <p className="mf-eyebrow">MotusFit · comece forte</p>
          <h1>Comece seu treino</h1>
          <p>Crie sua conta para salvar sua evolução com segurança.</p>
          <AuthForm mode="signup" />
          <p className="mt-6 text-sm">
            Já tem uma conta?{' '}
            <Link
              className="font-extrabold underline decoration-2 underline-offset-4"
              href="/login"
            >
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
