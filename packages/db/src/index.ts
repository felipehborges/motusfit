import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePg, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { drizzle as drizzlePglite, type PgliteDatabase } from 'drizzle-orm/pglite';
import { Pool } from 'pg';
import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema> | PgliteDatabase<typeof schema>;

export type CreateDatabaseOptions = {
  /** Connection string do Postgres. Ausente ⇒ PGlite (dev sem Docker / testes). */
  databaseUrl?: string | undefined;
  /** Caminho do PGlite. Default: './.data/motusfit'. 'memory://' para testes. */
  pgliteDataDir?: string | undefined;
};

/**
 * Fábrica única de conexão (ADR 0003): `DATABASE_URL` presente usa o driver pg;
 * ausente, sobe PGlite in-process — Postgres real, zero infraestrutura.
 */
export function createDatabase(options: CreateDatabaseOptions = {}): Database {
  if (options.databaseUrl) {
    const pool = new Pool({ connectionString: options.databaseUrl });
    return drizzlePg(pool, { schema });
  }
  const client = new PGlite(options.pgliteDataDir ?? './.data/motusfit');
  return drizzlePglite(client, { schema });
}

export { schema };
