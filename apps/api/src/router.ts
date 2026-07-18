import { contract } from '@motusfit/contracts';
import { implement } from '@orpc/server';

const os = implement(contract);

const health = os.health.handler(() => ({
  status: 'ok' as const,
  version: '0.0.0',
}));

/** Router v1: implementação do contrato (@motusfit/contracts). */
export const router = os.router({
  health,
});
