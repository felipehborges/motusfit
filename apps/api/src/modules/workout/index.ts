import { ORPCError } from '@orpc/server';
import { requireAuth } from '../../context';
import { implementedContract } from '../../implemented';
import {
  addSet,
  createExercise,
  createRoutine,
  finishSession,
  getSession,
  lastSetsForExercise,
  listHistory,
  listRoutines,
  removeRoutine,
  removeSet,
  searchExercises,
  startSession,
  updateRoutine,
} from './workout.repository';

const os = implementedContract.workout;

export const workoutRouter = {
  exercises: {
    create: os.exercises.create.use(requireAuth).handler(async ({ context, input }) => {
      const exercise = await createExercise(context.db, context.user.id, input);
      if (!exercise) {
        throw new ORPCError('CONFLICT', { message: 'Você já tem um exercício com esse nome' });
      }
      return exercise;
    }),
    search: os.exercises.search
      .use(requireAuth)
      .handler(({ context, input }) => searchExercises(context.db, context.user.id, input)),
  },
  routines: {
    list: os.routines.list
      .use(requireAuth)
      .handler(({ context }) => listRoutines(context.db, context.user.id)),
    create: os.routines.create.use(requireAuth).handler(async ({ context, input }) => {
      const routine = await createRoutine(context.db, context.user.id, input);
      if (!routine) throw new ORPCError('NOT_FOUND', { message: 'Exercício não encontrado' });
      return routine;
    }),
    update: os.routines.update.use(requireAuth).handler(async ({ context, input }) => {
      const routine = await updateRoutine(context.db, context.user.id, input);
      if (!routine) {
        throw new ORPCError('NOT_FOUND', { message: 'Rotina ou exercício não encontrado' });
      }
      return routine;
    }),
    remove: os.routines.remove.use(requireAuth).handler(async ({ context, input }) => {
      const deleted = await removeRoutine(context.db, context.user.id, input.id);
      if (!deleted) throw new ORPCError('NOT_FOUND', { message: 'Rotina não encontrada' });
      return { deleted };
    }),
  },
  sessions: {
    start: os.sessions.start.use(requireAuth).handler(async ({ context, input }) => {
      const session = await startSession(context.db, context.user.id, input);
      if (!session) throw new ORPCError('NOT_FOUND', { message: 'Rotina não encontrada' });
      return session;
    }),
    addSet: os.sessions.addSet.use(requireAuth).handler(async ({ context, input }) => {
      const result = await addSet(context.db, context.user.id, input);
      if (result === 'session-not-found' || result === 'exercise-not-found') {
        throw new ORPCError('NOT_FOUND', { message: 'Sessão ou exercício não encontrado' });
      }
      if (result === 'session-finished') {
        throw new ORPCError('CONFLICT', { message: 'Sessão já concluída não aceita novos sets' });
      }
      return result.set;
    }),
    removeSet: os.sessions.removeSet.use(requireAuth).handler(async ({ context, input }) => {
      const deleted = await removeSet(context.db, context.user.id, input.sessionId, input.setId);
      if (!deleted) throw new ORPCError('NOT_FOUND', { message: 'Set não encontrado' });
      return { deleted };
    }),
    finish: os.sessions.finish.use(requireAuth).handler(async ({ context, input }) => {
      const session = await finishSession(
        context.db,
        context.user.id,
        input.id,
        input.notes ?? null,
      );
      if (!session) throw new ORPCError('NOT_FOUND', { message: 'Sessão não encontrada' });
      return session;
    }),
    get: os.sessions.get.use(requireAuth).handler(async ({ context, input }) => {
      const session = await getSession(context.db, context.user.id, input.id);
      if (!session) throw new ORPCError('NOT_FOUND', { message: 'Sessão não encontrada' });
      return session;
    }),
    history: os.sessions.history
      .use(requireAuth)
      .handler(({ context, input }) =>
        listHistory(context.db, context.user.id, input.cursor, input.limit),
      ),
    lastSets: os.sessions.lastSets
      .use(requireAuth)
      .handler(({ context, input }) =>
        lastSetsForExercise(context.db, context.user.id, input.exerciseId),
      ),
  },
};
