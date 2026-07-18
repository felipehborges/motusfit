import { healthContract } from './health';
import { identityContract } from './identity';

/**
 * Contrato raiz da API v1 (contract-first — docs/api-guidelines.md).
 * Contextos de negócio (nutrition, workout, stats, identity) entram nas Fases 2+.
 */
export const contract = {
  health: healthContract,
  identity: identityContract,
};

export * from './identity';

export type Contract = typeof contract;
