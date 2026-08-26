import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { api } from '../../lib/api';

export function TodayCard({ date }: { date: string }) {
  const statsQuery = useQuery(api.stats.today.queryOptions({ input: { date } }));

  if (!statsQuery.data) return null;
  const stats = statsQuery.data;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Treino de hoje</Text>
      {stats.workoutSessions > 0 && (
        <Text style={styles.muted}>
          {stats.workoutSessions} treino{stats.workoutSessions > 1 ? 's' : ''} concluído
          {stats.workoutSessions > 1 ? 's' : ''} hoje 💪
        </Text>
      )}
      {stats.workoutSessions === 0 && (
        <Text style={styles.muted}>Seu próximo treino começa com uma decisão.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 4,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    padding: 12,
    gap: 4,
  },
  title: { fontSize: 18, fontWeight: '700' },
  muted: { color: '#71717a', fontSize: 13 },
});
