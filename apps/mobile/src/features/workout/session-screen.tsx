import type { Exercise, SessionDetail } from '@motusfit/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api } from '../../lib/api';

export function SessionScreen({ sessionId, onBack }: { sessionId: string; onBack: () => void }) {
  const queryClient = useQueryClient();
  const sessionQuery = useQuery(
    api.workout.sessions.get.queryOptions({ input: { id: sessionId } }),
  );

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: api.workout.sessions.get.key() });

  const finish = useMutation(
    api.workout.sessions.finish.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: api.workout.sessions.history.key() });
        onBack();
      },
    }),
  );

  if (sessionQuery.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }
  if (sessionQuery.isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Sessão não encontrada.</Text>
      </View>
    );
  }

  const session = sessionQuery.data;
  const readOnly = session.finishedAt !== null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.rowBetween}>
        <Pressable onPress={onBack}>
          <Text style={styles.link}>← voltar</Text>
        </Pressable>
        {!readOnly && (
          <Pressable
            style={styles.button}
            disabled={finish.isPending}
            onPress={() => finish.mutate({ id: session.id })}
          >
            <Text style={styles.buttonText}>Concluir treino</Text>
          </Pressable>
        )}
      </View>
      <Text style={styles.heading}>{session.title}</Text>
      <Text style={styles.muted}>
        {Math.round(session.volumeKg)} kg de volume · {session.totalSets} séries
        {session.estimatedKcal != null ? ` · ~${Math.round(session.estimatedKcal)} kcal` : ''}
      </Text>

      {session.exercises.map((exercise) => (
        <ExerciseBlock
          key={exercise.id}
          session={session}
          exercise={exercise}
          readOnly={readOnly}
          onChanged={invalidate}
        />
      ))}
    </ScrollView>
  );
}

function ExerciseBlock({
  session,
  exercise,
  readOnly,
  onChanged,
}: {
  session: SessionDetail;
  exercise: Exercise;
  readOnly: boolean;
  onChanged: () => void;
}) {
  const sets = session.sets.filter((s) => s.exerciseId === exercise.id);
  const lastSetsQuery = useQuery({
    ...api.workout.sessions.lastSets.queryOptions({ input: { exerciseId: exercise.id } }),
    enabled: !readOnly,
  });
  const suggestion = lastSetsQuery.data?.[sets.length] ?? lastSetsQuery.data?.at(-1);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{exercise.name}</Text>
      {sets.map((set, index) => (
        <Text key={set.id} style={styles.setText}>
          #{index + 1} — {set.reps} reps × {set.weightKg} kg
        </Text>
      ))}
      {!readOnly && (
        <SetForm
          sessionId={session.id}
          exerciseId={exercise.id}
          suggestedReps={suggestion?.reps}
          suggestedWeight={suggestion?.weightKg}
          onAdded={onChanged}
        />
      )}
    </View>
  );
}

function SetForm({
  sessionId,
  exerciseId,
  suggestedReps,
  suggestedWeight,
  onAdded,
}: {
  sessionId: string;
  exerciseId: string;
  suggestedReps?: number | undefined;
  suggestedWeight?: number | undefined;
  onAdded: () => void;
}) {
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [resting, setResting] = useState(0);

  useEffect(() => {
    if (suggestedReps !== undefined) setReps((v) => (v === '' ? String(suggestedReps) : v));
    if (suggestedWeight !== undefined) setWeight((v) => (v === '' ? String(suggestedWeight) : v));
  }, [suggestedReps, suggestedWeight]);

  useEffect(() => {
    if (resting <= 0) return;
    const timer = setTimeout(() => setResting((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [resting]);

  const addSet = useMutation(
    api.workout.sessions.addSet.mutationOptions({
      onSuccess: () => {
        setResting(90);
        onAdded();
      },
    }),
  );

  return (
    <View style={styles.setForm}>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        placeholder="reps"
        value={reps}
        onChangeText={setReps}
      />
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        placeholder="kg"
        value={weight}
        onChangeText={setWeight}
      />
      <Pressable
        style={styles.button}
        disabled={addSet.isPending || reps === '' || weight === ''}
        onPress={() =>
          addSet.mutate({
            sessionId,
            exerciseId,
            reps: Number(reps),
            weightKg: Number(weight),
            completed: true,
          })
        }
      >
        <Text style={styles.buttonText}>✓ Série feita</Text>
      </Pressable>
      {resting > 0 && <Text style={styles.muted}>descanso: {resting}s</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heading: { fontSize: 18, fontWeight: '700' },
  muted: { color: '#71717a', fontSize: 13 },
  error: { color: '#dc2626' },
  link: { color: '#52525b', textDecorationLine: 'underline' },
  card: {
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  cardTitle: { fontWeight: '600', fontSize: 15 },
  setText: { fontSize: 14 },
  setForm: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  input: {
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 64,
  },
  button: {
    backgroundColor: '#18181b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
