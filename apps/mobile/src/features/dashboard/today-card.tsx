import { roundMacrosForDisplay } from '@motusfit/core';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { api } from '../../lib/api';

export function TodayCard({ date }: { date: string }) {
  const statsQuery = useQuery(api.stats.today.queryOptions({ input: { date } }));

  if (!statsQuery.data) return null;
  const stats = statsQuery.data;
  const consumed = roundMacrosForDisplay(stats.consumed);

  return (
    <View style={styles.card}>
      <Text>
        <Text style={styles.kcal}>{consumed.kcal}</Text>
        {stats.goal && <Text style={styles.muted}> / {stats.goal.kcal} kcal</Text>}
        {stats.workoutKcal > 0 && (
          <Text style={styles.muted}> · treino ~{Math.round(stats.workoutKcal)} kcal</Text>
        )}
      </Text>
      {stats.remainingKcal != null && (
        <Text style={stats.remainingKcal < 0 ? styles.over : styles.under}>
          {stats.remainingKcal >= 0
            ? `restam ${Math.round(stats.remainingKcal)} kcal`
            : `${Math.round(-stats.remainingKcal)} kcal acima da meta`}
        </Text>
      )}
      {stats.workoutSessions > 0 && (
        <Text style={styles.muted}>
          {stats.workoutSessions} treino{stats.workoutSessions > 1 ? 's' : ''} concluído
          {stats.workoutSessions > 1 ? 's' : ''} hoje 💪
        </Text>
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
  kcal: { fontSize: 24, fontWeight: '700' },
  muted: { color: '#71717a', fontSize: 13 },
  under: { color: '#15803d', fontSize: 13 },
  over: { color: '#dc2626', fontSize: 13 },
});
