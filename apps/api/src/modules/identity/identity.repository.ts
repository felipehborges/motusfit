import type { Profile } from '@motusfit/contracts';
import { type Database, schema } from '@motusfit/db';
import { eq } from 'drizzle-orm';

// numeric no Postgres chega como string — conversão acontece só aqui, na borda do banco.
function toProfile(row: typeof schema.userProfiles.$inferSelect): Profile {
  return {
    displayName: row.displayName,
    bodyWeightKg: row.bodyWeightKg === null ? null : Number(row.bodyWeightKg),
    birthDate: row.birthDate,
    timezone: row.timezone,
    unitSystem: row.unitSystem,
  };
}

export async function findProfileByUserId(db: Database, userId: string): Promise<Profile | null> {
  const rows = await db
    .select()
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.userId, userId))
    .limit(1);
  const row = rows[0];
  return row ? toProfile(row) : null;
}

export type UpsertProfileData = {
  displayName: string;
  bodyWeightKg?: number | null | undefined;
  birthDate?: string | null | undefined;
  timezone?: string | undefined;
  unitSystem?: 'metric' | 'imperial' | undefined;
};

export async function upsertProfile(
  db: Database,
  userId: string,
  data: UpsertProfileData,
): Promise<Profile> {
  const values = {
    userId,
    displayName: data.displayName,
    bodyWeightKg: data.bodyWeightKg == null ? null : String(data.bodyWeightKg),
    birthDate: data.birthDate ?? null,
    ...(data.timezone !== undefined && { timezone: data.timezone }),
    ...(data.unitSystem !== undefined && { unitSystem: data.unitSystem }),
  };
  const rows = await db
    .insert(schema.userProfiles)
    .values(values)
    .onConflictDoUpdate({
      target: schema.userProfiles.userId,
      set: { ...values, updatedAt: new Date() },
    })
    .returning();
  const row = rows[0];
  if (!row) throw new Error('upsert de perfil não retornou linha');
  return toProfile(row);
}
