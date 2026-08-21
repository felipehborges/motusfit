'use client';

import { PageHeader } from '@/components/ui';
import { ProfileForm } from '@/features/profile/profile-form';

export default function ProfilePage() {
  return (
    <section>
      <PageHeader
        eyebrow="Configurações"
        title="Seu perfil fitness."
        description="Dados simples que ajudam o MotusFit a calcular e personalizar melhor sua jornada."
      />
      <ProfileForm />
    </section>
  );
}
