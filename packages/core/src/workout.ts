export type SetInput = {
  weightKg: number;
  reps: number;
  completed: boolean;
};

/** Volume = Σ(carga × reps) das séries completas (docs/domain-model.md). */
export function sessionVolumeKg(sets: readonly SetInput[]): number {
  return sets.filter((s) => s.completed).reduce((acc, s) => acc + s.weightKg * s.reps, 0);
}

/**
 * MET default para musculação com esforço moderado
 * (Compendium of Physical Activities, código 02052).
 */
export const DEFAULT_STRENGTH_TRAINING_MET = 5.0;

/**
 * Estimativa de gasto calórico da sessão: kcal = MET × peso(kg) × duração(h).
 * É uma estimativa — apresentada como tal na UI.
 */
export function estimateSessionKcal(params: {
  bodyWeightKg: number;
  durationMinutes: number;
  met?: number;
}): number {
  const { bodyWeightKg, durationMinutes, met = DEFAULT_STRENGTH_TRAINING_MET } = params;
  if (bodyWeightKg <= 0) throw new RangeError('bodyWeightKg deve ser > 0');
  if (durationMinutes < 0) throw new RangeError('durationMinutes deve ser >= 0');
  return met * bodyWeightKg * (durationMinutes / 60);
}
