'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export function ProfileForm() {
  const queryClient = useQueryClient();
  const profileQuery = useQuery(api.identity.profile.get.queryOptions());
  const [displayName, setDisplayName] = useState('');
  const [bodyWeightKg, setBodyWeightKg] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profileQuery.data) return;
    setDisplayName(profileQuery.data.displayName);
    setBodyWeightKg(
      profileQuery.data.bodyWeightKg != null ? String(profileQuery.data.bodyWeightKg) : '',
    );
  }, [profileQuery.data]);

  const saveProfile = useMutation(
    api.identity.profile.upsert.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: api.identity.profile.get.key() });
        setSaved(true);
      },
    }),
  );

  if (profileQuery.isPending) return <p>Carregando…</p>;

  return (
    <form
      className="flex max-w-sm flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(false);
        saveProfile.mutate({
          displayName,
          bodyWeightKg: bodyWeightKg === '' ? null : Number(bodyWeightKg),
        });
      }}
    >
      <label className="flex flex-col text-sm">
        Nome
        <input
          type="text"
          className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
      </label>
      <label className="flex flex-col text-sm">
        Peso corporal (kg)
        <input
          type="number"
          min="1"
          step="0.1"
          placeholder="ex.: 78.5"
          className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          value={bodyWeightKg}
          onChange={(e) => setBodyWeightKg(e.target.value)}
        />
        <span className="text-xs text-zinc-500">
          Usado para estimar o gasto calórico do treino.
        </span>
      </label>
      <button
        type="submit"
        disabled={saveProfile.isPending}
        className="rounded bg-zinc-900 px-3 py-1 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        Salvar
      </button>
      {saved && <p className="text-sm text-green-700">Salvo.</p>}
    </form>
  );
}
