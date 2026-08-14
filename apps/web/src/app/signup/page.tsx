import { redirect } from 'next/navigation';

export const metadata = { title: 'Criar conta — MotusFit' };

export default function SignupPage() {
  redirect('/app');
}
