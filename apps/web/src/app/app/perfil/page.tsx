'use client';

import { ProfileForm } from '@/features/profile/profile-form';

export default function ProfilePage() {
  return (
    <section className="w-full max-w-2xl">
      <h2 className="mb-4 text-lg font-semibold">Perfil</h2>
      <ProfileForm />
    </section>
  );
}
