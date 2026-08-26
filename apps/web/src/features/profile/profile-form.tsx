'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ShieldCheck, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, SectionHeader, StatusPill } from '@/components/ui';
import { api } from '@/lib/api';

export function ProfileForm() {
  const queryClient = useQueryClient();
  const profileQuery = useQuery(api.identity.profile.get.queryOptions());
  const [displayName, setDisplayName] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profileQuery.data) return;
    setDisplayName(profileQuery.data.displayName);
  }, [profileQuery.data]);

  const saveProfile = useMutation(
    api.identity.profile.upsert.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: api.identity.profile.get.key() });
        setSaved(true);
      },
    }),
  );

  if (profileQuery.isPending) return <p className="mf-loading">Carregando perfil…</p>;

  return (
    <div className="mf-profile-grid">
      <Card className="mf-profile-identity">
        <div className="mf-profile-avatar">
          <UserRound size={30} />
        </div>
        <p className="mf-eyebrow">Atleta Motus</p>
        <h2>{displayName || 'Seu nome'}</h2>
        <p>Construa hábitos, acumule consistência e acompanhe cada etapa.</p>
        <div className="mf-profile-badge">
          <ShieldCheck size={15} /> Perfil local protegido
        </div>
      </Card>
      <Card className="mf-profile-form-card">
        <form
          className="mf-profile-form"
          onSubmit={(e) => {
            e.preventDefault();
            setSaved(false);
            saveProfile.mutate({
              displayName,
            });
          }}
        >
          <SectionHeader
            eyebrow="Dados pessoais"
            title="Informações básicas"
            description="Usadas apenas para personalizar sua experiência."
            action={
              saved ? (
                <StatusPill tone="success">
                  <Check size={12} /> Salvo
                </StatusPill>
              ) : undefined
            }
          />
          <label className="mf-field">
            Nome de exibição
            <span className="mf-input-icon">
              <UserRound size={16} />
              <input
                type="text"
                className="mf-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </span>
          </label>
          <button type="submit" disabled={saveProfile.isPending} className="mf-btn">
            Salvar
          </button>
        </form>
      </Card>
    </div>
  );
}
