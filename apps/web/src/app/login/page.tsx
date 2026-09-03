import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { AuthForm } from '@/features/auth/auth-form';

export const metadata = { title: 'Entrar — MotusFit' };

export default function LoginPage() {
  return (
    <main className="mf-auth-page">
      <Card className="mf-auth-card">
        <CardContent className="p-7 sm:p-10">
          <p className="mf-eyebrow">MotusFit · força em movimento</p>
          <h1>Bem-vindo de volta</h1>
          <p>Entre para continuar registrando seus treinos.</p>
          <AuthForm mode="login" />
          <p className="mt-6 text-sm">
            Ainda não tem uma conta?{' '}
            <Link
              className="font-extrabold underline decoration-2 underline-offset-4"
              href="/signup"
            >
              Criar conta
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
