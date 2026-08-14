import { redirect } from 'next/navigation';

export const metadata = { title: 'Entrar — MotusFit' };

export default function LoginPage() {
  redirect('/app');
}
