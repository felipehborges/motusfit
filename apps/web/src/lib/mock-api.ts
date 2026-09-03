import type { Exercise, Routine, SessionDetail } from '@motusfit/contracts';

export const DEMO_MODE = true;

const ids = {
  routine: '11111111-1111-4111-8111-111111111111',
  session: '22222222-2222-4222-8222-222222222222',
  squat: '33333333-3333-4333-8333-333333333333',
  bench: '44444444-4444-4444-8444-444444444444',
};

const exercises: Exercise[] = [
  {
    id: ids.squat,
    name: 'Agachamento livre',
    muscleGroup: 'legs',
    equipment: 'Barra',
    source: 'catalog',
  },
  {
    id: ids.bench,
    name: 'Supino reto',
    muscleGroup: 'chest',
    equipment: 'Barra',
    source: 'catalog',
  },
];

const routine: Routine = {
  id: ids.routine,
  name: 'Força total',
  notes: 'Demonstração local',
  exercises: exercises.map((exercise, position) => ({
    id: `55555555-5555-4555-8555-${String(position + 1).padStart(12, '0')}`,
    exercise,
    position,
    targetSets: 3,
    targetRepsMin: 8,
    targetRepsMax: 12,
    restSeconds: 90,
  })),
};

const session: SessionDetail = {
  id: ids.session,
  title: routine.name,
  routineId: routine.id,
  startedAt: '2026-09-02T12:00:00.000Z',
  finishedAt: null,
  volumeKg: 1760,
  totalSets: 6,
  estimatedKcal: 320,
  notes: null,
  exercises,
  sets: [
    {
      id: '66666666-6666-4666-8666-000000000001',
      exerciseId: ids.squat,
      position: 0,
      reps: 10,
      weightKg: 80,
      restSeconds: 90,
      completed: true,
    },
    {
      id: '66666666-6666-4666-8666-000000000002',
      exerciseId: ids.squat,
      position: 1,
      reps: 8,
      weightKg: 85,
      restSeconds: 90,
      completed: true,
    },
    {
      id: '66666666-6666-4666-8666-000000000003',
      exerciseId: ids.bench,
      position: 0,
      reps: 10,
      weightKg: 55,
      restSeconds: 90,
      completed: true,
    },
  ],
};

function json(body: unknown) {
  return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
}

/** Interceptador local provisório: não permite nenhuma requisição de API sair do navegador. */
export const mockFetch: typeof fetch = async (input, init) => {
  const request = new Request(input, init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/v1/, '');
  const method = request.method;

  if (path.startsWith('/stats/today/'))
    return json({ date: path.split('/').at(-1), workoutSessions: 1 });
  if (path.startsWith('/stats/weekly/'))
    return json({
      weekStart: '2026-08-31',
      workoutSessions: 4,
      activeDays: 3,
      totalVolumeKg: 8460,
      setsByMuscleGroup: [
        { muscleGroup: 'legs', sets: 9 },
        { muscleGroup: 'chest', sets: 7 },
        { muscleGroup: 'back', sets: 6 },
      ],
    });
  if (path === '/identity/profile' && method === 'GET')
    return json({
      displayName: 'Felipe',
      bodyWeightKg: 78,
      birthDate: null,
      timezone: 'America/Sao_Paulo',
      unitSystem: 'metric',
    });
  if (path === '/identity/profile')
    return json({
      displayName: 'Felipe',
      bodyWeightKg: 78,
      birthDate: null,
      timezone: 'America/Sao_Paulo',
      unitSystem: 'metric',
    });
  if (path === '/workout/routines' && method === 'GET') return json([routine]);
  if (path === '/workout/routines' && method === 'POST') return json(routine);
  if (path.startsWith('/workout/routines/'))
    return json(method === 'DELETE' ? { deleted: true } : routine);
  if (path === '/workout/sessions' && method === 'GET')
    return json({ sessions: [{ ...session }], nextCursor: null });
  if (path === '/workout/sessions' && method === 'POST') return json(session);
  if (path.startsWith('/workout/sessions/') && path.endsWith('/finish'))
    return json({ ...session, finishedAt: '2026-09-02T13:00:00.000Z' });
  if (path.startsWith('/workout/sessions/') && path.includes('/sets'))
    return json(method === 'DELETE' ? { deleted: true } : session.sets[0]);
  if (path.startsWith('/workout/sessions/')) return json(session);
  if (path === '/workout/exercises') return json(exercises);
  if (path.includes('/last-sets')) return json(session.sets);
  return json({});
};
