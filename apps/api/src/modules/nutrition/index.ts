import { sumMacros } from '@motusfit/core';
import { ORPCError } from '@orpc/server';
import { requireAuth } from '../../context';
import { implementedContract } from '../../implemented';
import {
  addEntry,
  createFood,
  getCurrentGoal,
  getGoalForDate,
  listEntriesByDay,
  recentFoods,
  removeEntry,
  searchFoods,
  setFavorite,
  setGoal,
  updateEntry,
} from './nutrition.repository';

const os = implementedContract.nutrition;

export const nutritionRouter = {
  foods: {
    create: os.foods.create
      .use(requireAuth)
      .handler(({ context, input }) => createFood(context.db, context.user.id, input)),
    search: os.foods.search
      .use(requireAuth)
      .handler(({ context, input }) =>
        searchFoods(context.db, context.user.id, input.query, input.limit),
      ),
    recent: os.foods.recent
      .use(requireAuth)
      .handler(({ context }) => recentFoods(context.db, context.user.id)),
    setFavorite: os.foods.setFavorite.use(requireAuth).handler(async ({ context, input }) => {
      const ok = await setFavorite(context.db, context.user.id, input.foodId, input.favorite);
      if (!ok) throw new ORPCError('NOT_FOUND', { message: 'Alimento não encontrado' });
      return { foodId: input.foodId, favorite: input.favorite };
    }),
  },
  diary: {
    listByDay: os.diary.listByDay.use(requireAuth).handler(async ({ context, input }) => {
      const [entries, goal] = await Promise.all([
        listEntriesByDay(context.db, context.user.id, input.date),
        getGoalForDate(context.db, context.user.id, input.date),
      ]);
      return {
        date: input.date,
        entries,
        totals: sumMacros(entries.map((e) => e.macros)),
        goal,
      };
    }),
    add: os.diary.add.use(requireAuth).handler(async ({ context, input }) => {
      const entry = await addEntry(context.db, context.user.id, input);
      if (!entry) throw new ORPCError('NOT_FOUND', { message: 'Alimento não encontrado' });
      return entry;
    }),
    update: os.diary.update.use(requireAuth).handler(async ({ context, input }) => {
      const entry = await updateEntry(context.db, context.user.id, input.id, input);
      if (!entry) throw new ORPCError('NOT_FOUND', { message: 'Entrada não encontrada' });
      return entry;
    }),
    remove: os.diary.remove.use(requireAuth).handler(async ({ context, input }) => {
      const deleted = await removeEntry(context.db, context.user.id, input.id);
      if (!deleted) throw new ORPCError('NOT_FOUND', { message: 'Entrada não encontrada' });
      return { deleted };
    }),
  },
  goals: {
    getCurrent: os.goals.getCurrent
      .use(requireAuth)
      .handler(({ context }) => getCurrentGoal(context.db, context.user.id)),
    set: os.goals.set
      .use(requireAuth)
      .handler(({ context, input }) => setGoal(context.db, context.user.id, input)),
  },
};
