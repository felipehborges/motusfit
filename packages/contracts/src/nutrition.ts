import { oc } from '@orpc/contract';
import { z } from 'zod';

export const mealSlotSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);
export type MealSlot = z.infer<typeof mealSlotSchema>;

export const macrosSchema = z.object({
  kcal: z.number().nonnegative(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  fatG: z.number().nonnegative(),
});

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'esperado YYYY-MM-DD');

export const foodSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(200),
  brand: z.string().max(100).nullable(),
  source: z.enum(['user', 'catalog']),
  servingSize: z.number().positive(),
  servingUnit: z.enum(['g', 'ml', 'unit']),
  kcal: z.number().nonnegative(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  fatG: z.number().nonnegative(),
  isFavorite: z.boolean(),
});
export type Food = z.infer<typeof foodSchema>;

export const foodInputSchema = foodSchema.omit({ id: true, source: true, isFavorite: true });

export const diaryEntrySchema = z.object({
  id: z.uuid(),
  date: dateSchema,
  mealSlot: mealSlotSchema,
  quantity: z.number().positive(),
  food: foodSchema,
  macros: macrosSchema,
});
export type DiaryEntry = z.infer<typeof diaryEntrySchema>;

export const nutritionGoalSchema = z.object({
  kcal: z.number().positive(),
  proteinG: z.number().positive(),
  carbsG: z.number().positive(),
  fatG: z.number().positive(),
  effectiveFrom: dateSchema,
});
export type NutritionGoal = z.infer<typeof nutritionGoalSchema>;

export const nutritionContract = {
  foods: {
    create: oc
      .route({ method: 'POST', path: '/nutrition/foods', tags: ['nutrition'] })
      .input(foodInputSchema)
      .output(foodSchema),
    search: oc
      .route({ method: 'GET', path: '/nutrition/foods', tags: ['nutrition'] })
      .input(
        z.object({
          query: z.string().max(200).optional(),
          limit: z.coerce.number().int().min(1).max(100).default(20),
        }),
      )
      .output(z.array(foodSchema)),
    recent: oc
      .route({ method: 'GET', path: '/nutrition/foods/recent', tags: ['nutrition'] })
      .output(z.array(foodSchema)),
    setFavorite: oc
      .route({ method: 'PUT', path: '/nutrition/foods/{foodId}/favorite', tags: ['nutrition'] })
      .input(z.object({ foodId: z.uuid(), favorite: z.boolean() }))
      .output(z.object({ foodId: z.uuid(), favorite: z.boolean() })),
  },
  diary: {
    listByDay: oc
      .route({ method: 'GET', path: '/nutrition/diary/{date}', tags: ['nutrition'] })
      .input(z.object({ date: dateSchema }))
      .output(
        z.object({
          date: dateSchema,
          entries: z.array(diaryEntrySchema),
          totals: macrosSchema,
          goal: nutritionGoalSchema.nullable(),
        }),
      ),
    add: oc
      .route({ method: 'POST', path: '/nutrition/diary', tags: ['nutrition'] })
      .input(
        z.object({
          date: dateSchema,
          mealSlot: mealSlotSchema,
          foodId: z.uuid(),
          quantity: z.number().positive(),
          clientId: z.uuid().optional(),
        }),
      )
      .output(diaryEntrySchema),
    update: oc
      .route({ method: 'PATCH', path: '/nutrition/diary/{id}', tags: ['nutrition'] })
      .input(
        z.object({
          id: z.uuid(),
          quantity: z.number().positive().optional(),
          mealSlot: mealSlotSchema.optional(),
        }),
      )
      .output(diaryEntrySchema),
    remove: oc
      .route({ method: 'DELETE', path: '/nutrition/diary/{id}', tags: ['nutrition'] })
      .input(z.object({ id: z.uuid() }))
      .output(z.object({ deleted: z.boolean() })),
  },
  goals: {
    getCurrent: oc
      .route({ method: 'GET', path: '/nutrition/goals/current', tags: ['nutrition'] })
      .output(nutritionGoalSchema.nullable()),
    set: oc
      .route({ method: 'PUT', path: '/nutrition/goals/current', tags: ['nutrition'] })
      .input(nutritionGoalSchema.omit({ effectiveFrom: true }).extend({ date: dateSchema }))
      .output(nutritionGoalSchema),
  },
};
