import { healthContract } from './health';

/**
 * Contrato raiz da API v1 (contract-first — docs/api-guidelines.md).
 * Contextos de negócio (nutrition, workout, stats, identity) entram nas Fases 2+.
 */
export const contract = {
  health: healthContract,
};

export type Contract = typeof contract;
