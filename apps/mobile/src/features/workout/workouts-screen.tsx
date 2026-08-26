import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../../lib/api';

export function WorkoutsScreen({ onOpenSession }: { onOpenSession: (id: string) => void }) {
  const queryClient = useQueryClient();
  const routinesQuery = useQuery(api.workout.routines.list.queryOptions());
  const historyQuery = useQuery(
    api.workout.sessions.history.queryOptions({ input: { limit: 10 } }),
  );

  const startSession = useMutation(
    api.workout.sessions.start.mutationOptions({
      onSuccess: (session) => {
        queryClient.invalidateQueries({ queryKey: api.workout.sessions.history.key() });
        onOpenSession(session.id);
      },
    }),
  );

  if (routinesQuery.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.rowBetween}>
        <Text style={styles.heading}>Rotinas</Text>
        <Pressable style={styles.buttonOutline} onPress={() => startSession.mutate({})}>
          <Text>Treino livre</Text>
        </Pressable>
      </View>
      {(routinesQuery.data ?? []).map((routine) => (
        <View key={routine.id} style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.flex1}>
              <Text style={styles.cardTitle}>{routine.name}</Text>
              <Text style={styles.muted} numberOfLines={1}>
                {routine.exercises.map((e) => e.exercise.name).join(' · ') || 'Sem exercícios'}
              </Text>
            </View>
            <Pressable
              style={styles.button}
              onPress={() => startSession.mutate({ routineId: routine.id })}
            >
              <Text style={styles.buttonText}>Iniciar</Text>
            </Pressable>
          </View>
        </View>
      ))}
      {routinesQuery.data?.length === 0 && (
        <Text style={styles.muted}>
          Nenhuma rotina ainda — crie no app web; edição mobile chega em breve.
        </Text>
      )}

      <Text style={[styles.heading, styles.historyHeading]}>Histórico</Text>
      {(historyQuery.data?.sessions ?? []).map((session) => (
        <Pressable key={session.id} style={styles.card} onPress={() => onOpenSession(session.id)}>
          <Text style={styles.cardTitle}>
            {session.title}
            {session.finishedAt === null ? ' (em andamento)' : ''}
          </Text>
          <Text style={styles.muted}>
            {session.startedAt.slice(0, 10)} · {session.totalSets} séries ·{' '}
            {Math.round(session.volumeKg)} kg
          </Text>
        </Pressable>
      ))}
      {historyQuery.data?.sessions.length === 0 && (
        <Text style={styles.muted}>Nenhum treino registrado.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  flex1: { flex: 1 },
  heading: { fontSize: 18, fontWeight: '700' },
  historyHeading: { marginTop: 12 },
  card: {
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  cardTitle: { fontWeight: '600', fontSize: 15 },
  muted: { color: '#71717a', fontSize: 13 },
  button: {
    backgroundColor: '#18181b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  buttonOutline: {
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
