import { applyMigrations, createDatabase, schema } from '@motusfit/db';
import { eq } from 'drizzle-orm';
import type { MuscleGroup } from './seed-data/exercises';
import { catalogExercises } from './seed-data/exercises';

/**
 * Popula o catálogo público de exercícios (source: 'catalog', ownerId: null).
 * Idempotente: só insere nomes que ainda não existem no catálogo (a unique
 * index de exercises trata NULL como distinto, então onConflictDoNothing não
 * bastaria aqui).
 */
async function seedExercises(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  // Sem DATABASE_URL: aponta pro mesmo PGlite que `pnpm dev` usa (apps/api/.data/motusfit).
  const pgliteDataDir = new URL('../apps/api/.data/motusfit', import.meta.url).pathname.replace(
    /^\/([A-Za-z]:)/,
    '$1',
  );

  const db = createDatabase({ databaseUrl, pgliteDataDir });
  await applyMigrations(db);

  const existing = await db
    .select({ name: schema.exercises.name })
    .from(schema.exercises)
    .where(eq(schema.exercises.source, 'catalog'));
  const existingNames = new Set(existing.map((row) => row.name));

  const toInsert = catalogExercises.filter((exercise) => !existingNames.has(exercise.name));

  if (toInsert.length === 0) {
    console.log(`Catálogo já tem os ${catalogExercises.length} exercícios. Nada a fazer.`);
    return;
  }

  await db.insert(schema.exercises).values(
    toInsert.map((exercise) => ({
      ownerId: null,
      source: 'catalog' as const,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup satisfies MuscleGroup,
      equipment: exercise.equipment,
    })),
  );

  console.log(
    `${toInsert.length} exercício(s) novo(s) inserido(s) no catálogo (${existingNames.size} já existiam).`,
  );
}

seedExercises()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Falha ao popular o catálogo de exercícios:', error);
    process.exit(1);
  });
