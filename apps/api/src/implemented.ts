import { contract } from '@motusfit/contracts';
import { implement } from '@orpc/server';
import type { AppContext } from './context';

/** Implementador do contrato com o contexto da aplicação. */
export const implementedContract = implement(contract).$context<AppContext>();
