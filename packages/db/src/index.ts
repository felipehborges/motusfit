import { mkdirSync } from 'node:fs';
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
  const dataDir = options.pgliteDataDir ?? './.data/motusfit';
  if (!dataDir.startsWith('memory://')) {
    // PGlite não cria o diretório recursivamente
    mkdirSync(dataDir, { recursive: true });
  }
  const client = new PGlite(dataDir);
  return drizzlePglite(client, { schema });
}

/**
 * Aplica as migrations commitadas (packages/db/migrations) programaticamente.
 * Usado no bootstrap com PGlite (dev/testes); produção usa drizzle-kit migrate.
 */
export async function applyMigrations(db: Database): Promise<void> {
  const migrationsFolder = new URL('../migrations', import.meta.url).pathname.replace(
    /^\/([A-Za-z]:)/,
    '$1',
  );
  if ('$client' in db && db.$client instanceof PGlite) {
    const { migrate } = await import('drizzle-orm/pglite/migrator');
    await migrate(db as PgliteDatabase<typeof schema>, { migrationsFolder });
  } else {
    const { migrate } = await import('drizzle-orm/node-postgres/migrator');
    await migrate(db as NodePgDatabase<typeof schema>, { migrationsFolder });
  }
}

export { schema };
