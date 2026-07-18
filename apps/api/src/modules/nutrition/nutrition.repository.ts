import type { DiaryEntry, Food, MealSlot, NutritionGoal } from '@motusfit/contracts';
import { scaleMacros } from '@motusfit/core';
import { type Database, schema } from '@motusfit/db';
import { and, desc, eq, ilike, isNull, lte, max, or, sql } from 'drizzle-orm';

type FoodRow = typeof schema.foods.$inferSelect;

function toFood(row: FoodRow, isFavorite: boolean): Food {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    source: row.source,
    servingSize: Number(row.servingSize),
    servingUnit: row.servingUnit,
    kcal: Number(row.kcal),
    proteinG: Number(row.proteinG),
    carbsG: Number(row.carbsG),
    fatG: Number(row.fatG),
    isFavorite,
  };
}

function entryMacros(food: Food, quantity: number) {
  return scaleMacros(
    {
      servingSize: food.servingSize,
      macros: { kcal: food.kcal, proteinG: food.proteinG, carbsG: food.carbsG, fatG: food.fatG },
    },
    quantity,
  );
}

/** Alimento acessível ao usuário: dele ou de catálogo. */
function accessibleFood(userId: string) {
  return or(eq(schema.foods.ownerId, userId), isNull(schema.foods.ownerId));
}

export type CreateFoodData = {
  name: string;
  brand?: string | null | undefined;
  servingSize: number;
  servingUnit: 'g' | 'ml' | 'unit';
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export async function createFood(
  db: Database,
  userId: string,
  data: CreateFoodData,
): Promise<Food> {
  const rows = await db
    .insert(schema.foods)
    .values({
      ownerId: userId,
      source: 'user',
      name: data.name,
      brand: data.brand ?? null,
      servingSize: String(data.servingSize),
      servingUnit: data.servingUnit,
      kcal: String(data.kcal),
      proteinG: String(data.proteinG),
      carbsG: String(data.carbsG),
      fatG: String(data.fatG),
    })
    .returning();
  const row = rows[0];
  if (!row) throw new Error('insert de alimento não retornou linha');
  return toFood(row, false);
}

export async function searchFoods(
  db: Database,
  userId: string,
  query: string | undefined,
  limit: number,
): Promise<Food[]> {
  const rows = await db
    .select({
      food: schema.foods,
      favoritedAt: schema.foodFavorites.createdAt,
    })
    .from(schema.foods)
    .leftJoin(
      schema.foodFavorites,
      and(
        eq(schema.foodFavorites.foodId, schema.foods.id),
        eq(schema.foodFavorites.userId, userId),
      ),
    )
    .where(and(accessibleFood(userId), query ? ilike(schema.foods.name, `%${query}%`) : undefined))
    .orderBy(sql`${schema.foodFavorites.createdAt} IS NULL`, schema.foods.name)
    .limit(limit);
  return rows.map((r) => toFood(r.food, r.favoritedAt !== null));
}

export async function recentFoods(db: Database, userId: string): Promise<Food[]> {
  const recents = db
    .select({
      foodId: schema.diaryEntries.foodId,
      lastLogged: max(schema.diaryEntries.loggedAt).as('last_logged'),
    })
    .from(schema.diaryEntries)
    .where(eq(schema.diaryEntries.userId, userId))
    .groupBy(schema.diaryEntries.foodId)
    .as('recents');

  const rows = await db
    .select({
      food: schema.foods,
      favoritedAt: schema.foodFavorites.createdAt,
    })
    .from(recents)
    .innerJoin(schema.foods, eq(schema.foods.id, recents.foodId))
    .leftJoin(
      schema.foodFavorites,
      and(
        eq(schema.foodFavorites.foodId, schema.foods.id),
        eq(schema.foodFavorites.userId, userId),
      ),
    )
    .orderBy(desc(recents.lastLogged))
    .limit(20);
  return rows.map((r) => toFood(r.food, r.favoritedAt !== null));
}

/** Retorna false se o alimento não existe/não é acessível ao usuário. */
export async function setFavorite(
  db: Database,
  userId: string,
  foodId: string,
  favorite: boolean,
): Promise<boolean> {
  const found = await db
    .select({ id: schema.foods.id })
    .from(schema.foods)
    .where(and(eq(schema.foods.id, foodId), accessibleFood(userId)))
    .limit(1);
  if (!found[0]) return false;

  if (favorite) {
    await db.insert(schema.foodFavorites).values({ userId, foodId }).onConflictDoNothing();
  } else {
    await db
      .delete(schema.foodFavorites)
      .where(and(eq(schema.foodFavorites.userId, userId), eq(schema.foodFavorites.foodId, foodId)));
  }
  return true;
}

type EntryRow = typeof schema.diaryEntries.$inferSelect;

function toEntry(row: EntryRow, food: Food): DiaryEntry {
  const quantity = Number(row.quantity);
  return {
    id: row.id,
    date: row.date,
    mealSlot: row.mealSlot,
    quantity,
    food,
    macros: entryMacros(food, quantity),
  };
}

export type AddEntryData = {
  date: string;
  mealSlot: MealSlot;
  foodId: string;
  quantity: number;
  clientId?: string | undefined;
};

/** Insere entrada; idempotente por (userId, clientId). Null se o alimento não é acessível. */
export async function addEntry(
  db: Database,
  userId: string,
  data: AddEntryData,
): Promise<DiaryEntry | null> {
  const foodRows = await db
    .select()
    .from(schema.foods)
    .where(and(eq(schema.foods.id, data.foodId), accessibleFood(userId)))
    .limit(1);
  const foodRow = foodRows[0];
  if (!foodRow) return null;

  const inserted = await db
    .insert(schema.diaryEntries)
    .values({
      userId,
      date: data.date,
      mealSlot: data.mealSlot,
      foodId: data.foodId,
      quantity: String(data.quantity),
      clientId: data.clientId ?? null,
    })
    .onConflictDoNothing()
    .returning();

  let row = inserted[0];
  if (!row) {
    // Conflito de clientId ⇒ retry: devolve a entrada já criada
    const existing = await db
      .select()
      .from(schema.diaryEntries)
      .where(
        and(
          eq(schema.diaryEntries.userId, userId),
          eq(schema.diaryEntries.clientId, data.clientId ?? ''),
        ),
      )
      .limit(1);
    row = existing[0];
  }
  if (!row) throw new Error('insert de entrada não retornou linha');

  const isFavorite = await db
    .select({ userId: schema.foodFavorites.userId })
    .from(schema.foodFavorites)
    .where(
      and(eq(schema.foodFavorites.userId, userId), eq(schema.foodFavorites.foodId, foodRow.id)),
    )
    .limit(1);
  return toEntry(row, toFood(foodRow, isFavorite.length > 0));
}

export async function listEntriesByDay(
  db: Database,
  userId: string,
  dateValue: string,
): Promise<DiaryEntry[]> {
  const rows = await db
    .select({
      entry: schema.diaryEntries,
      food: schema.foods,
      favoritedAt: schema.foodFavorites.createdAt,
    })
    .from(schema.diaryEntries)
    .innerJoin(schema.foods, eq(schema.foods.id, schema.diaryEntries.foodId))
    .leftJoin(
      schema.foodFavorites,
      and(
        eq(schema.foodFavorites.foodId, schema.foods.id),
        eq(schema.foodFavorites.userId, userId),
      ),
    )
    .where(and(eq(schema.diaryEntries.userId, userId), eq(schema.diaryEntries.date, dateValue)))
    .orderBy(schema.diaryEntries.loggedAt);
  return rows.map((r) => toEntry(r.entry, toFood(r.food, r.favoritedAt !== null)));
}

export async function updateEntry(
  db: Database,
  userId: string,
  id: string,
  changes: { quantity?: number | undefined; mealSlot?: MealSlot | undefined },
): Promise<DiaryEntry | null> {
  const rows = await db
    .update(schema.diaryEntries)
    .set({
      ...(changes.quantity !== undefined && { quantity: String(changes.quantity) }),
      ...(changes.mealSlot !== undefined && { mealSlot: changes.mealSlot }),
      updatedAt: new Date(),
    })
    .where(and(eq(schema.diaryEntries.id, id), eq(schema.diaryEntries.userId, userId)))
    .returning();
  const row = rows[0];
  if (!row) return null;

  const foodRows = await db
    .select({ food: schema.foods, favoritedAt: schema.foodFavorites.createdAt })
    .from(schema.foods)
    .leftJoin(
      schema.foodFavorites,
      and(
        eq(schema.foodFavorites.foodId, schema.foods.id),
        eq(schema.foodFavorites.userId, userId),
      ),
    )
    .where(eq(schema.foods.id, row.foodId))
    .limit(1);
  const foodRow = foodRows[0];
  if (!foodRow) throw new Error('entrada sem alimento correspondente');
  return toEntry(row, toFood(foodRow.food, foodRow.favoritedAt !== null));
}

export async function removeEntry(db: Database, userId: string, id: string): Promise<boolean> {
  const rows = await db
    .delete(schema.diaryEntries)
    .where(and(eq(schema.diaryEntries.id, id), eq(schema.diaryEntries.userId, userId)))
    .returning();
  return rows.length > 0;
}

type GoalRow = typeof schema.nutritionGoals.$inferSelect;

function toGoal(row: GoalRow): NutritionGoal {
  return {
    kcal: Number(row.kcal),
    proteinG: Number(row.proteinG),
    carbsG: Number(row.carbsG),
    fatG: Number(row.fatG),
    effectiveFrom: row.effectiveFrom,
  };
}

export async function getCurrentGoal(db: Database, userId: string): Promise<NutritionGoal | null> {
  const rows = await db
    .select()
    .from(schema.nutritionGoals)
    .where(and(eq(schema.nutritionGoals.userId, userId), isNull(schema.nutritionGoals.effectiveTo)))
    .limit(1);
  const row = rows[0];
  return row ? toGoal(row) : null;
}

/** Meta vigente na data (vigência [from, to)). */
export async function getGoalForDate(
  db: Database,
  userId: string,
  dateValue: string,
): Promise<NutritionGoal | null> {
  const rows = await db
    .select()
    .from(schema.nutritionGoals)
    .where(
      and(
        eq(schema.nutritionGoals.userId, userId),
        lte(schema.nutritionGoals.effectiveFrom, dateValue),
        or(
          isNull(schema.nutritionGoals.effectiveTo),
          sql`${schema.nutritionGoals.effectiveTo} > ${dateValue}`,
        ),
      ),
    )
    .orderBy(desc(schema.nutritionGoals.effectiveFrom))
    .limit(1);
  const row = rows[0];
  return row ? toGoal(row) : null;
}

export type SetGoalData = {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  /** Data local do usuário — início da vigência. */
  date: string;
};

/** Encerra a meta vigente (to = nova from, vigência [from, to)) e cria a nova. */
export async function setGoal(
  db: Database,
  userId: string,
  data: SetGoalData,
): Promise<NutritionGoal> {
  return db.transaction(async (tx) => {
    await tx
      .update(schema.nutritionGoals)
      .set({ effectiveTo: data.date })
      .where(
        and(eq(schema.nutritionGoals.userId, userId), isNull(schema.nutritionGoals.effectiveTo)),
      );
    const rows = await tx
      .insert(schema.nutritionGoals)
      .values({
        userId,
        kcal: String(data.kcal),
        proteinG: String(data.proteinG),
        carbsG: String(data.carbsG),
        fatG: String(data.fatG),
        effectiveFrom: data.date,
      })
      .returning();
    const row = rows[0];
    if (!row) throw new Error('insert de meta não retornou linha');
    return toGoal(row);
  });
}
