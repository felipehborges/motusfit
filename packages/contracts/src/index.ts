import { healthContract } from './health';
import { identityContract } from './identity';
import { nutritionContract } from './nutrition';
import { workoutContract } from './workout';

/**
 * Contrato raiz da API v1 (contract-first — docs/api-guidelines.md).
 * Contextos de negócio (nutrition, workout, stats, identity) entram nas Fases 2+.
 */
export const contract = {
  health: healthContract,
  identity: identityContract,
  nutrition: nutritionContract,
  workout: workoutContract,
};

export * from './identity';
export * from './nutrition';
export * from './workout';

export type Contract = typeof contract;
