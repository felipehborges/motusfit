import { implementedContract } from './implemented';
import { identityRouter } from './modules/identity';

const health = implementedContract.health.handler(() => ({
  status: 'ok' as const,
  version: '0.0.0',
}));

/** Router v1: implementação do contrato (@motusfit/contracts). */
export const router = implementedContract.router({
  health,
  identity: identityRouter,
});
