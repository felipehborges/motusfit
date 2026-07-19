import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../../lib/api';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Peito',
  back: 'Costas',
  shoulders: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  legs: 'Pernas',
  glutes: 'Glúteos',
  core: 'Core',
  other: 'Outro',
};

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export function WeeklyStatsScreen({ date }: { date: string }) {
  const statsQuery = useQuery(api.stats.weekly.queryOptions({ input: { date } }));

  if (statsQuery.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }
  if (statsQuery.isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Erro ao carregar estatísticas.</Text>
      </View>
    );
  }

  const stats = statsQuery.data;
  const maxKcal = Math.max(...stats.kcalByDay.map((d) => d.kcal), 1);
  const maxSets = Math.max(...stats.setsByMuscleGroup.map((g) => g.sets), 1);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.heading}>Semana de {stats.weekStart}</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Sessões</Text>
            <Text style={styles.summaryValue}>{stats.workoutSessions}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Volume</Text>
            <Text style={styles.summaryValue}>{Math.round(stats.totalVolumeKg)} kg</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>kcal treino</Text>
            <Text style={styles.summaryValue}>{Math.round(stats.workoutKcal)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Calorias por dia</Text>
        <View style={styles.barsRow}>
          {stats.kcalByDay.map((day, index) => (
            <View key={day.date} style={styles.barColumn}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    { height: `${Math.max((day.kcal / maxKcal) * 100, day.kcal > 0 ? 4 : 0)}%` },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{WEEKDAY_LABELS[index]}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Séries por grupo muscular</Text>
        {stats.setsByMuscleGroup.length === 0 && (
          <Text style={styles.muted}>Nenhuma série completa nesta semana.</Text>
        )}
        {stats.setsByMuscleGroup.map((group) => (
          <View key={group.muscleGroup} style={styles.muscleRow}>
            <Text style={styles.muscleLabel}>
              {MUSCLE_LABELS[group.muscleGroup] ?? group.muscleGroup}
            </Text>
            <View style={styles.muscleTrack}>
              <View style={[styles.muscleBar, { width: `${(group.sets / maxSets) * 100}%` }]} />
            </View>
            <Text style={styles.muscleValue}>{group.sets}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#dc2626' },
  muted: { color: '#71717a', fontSize: 13 },
  card: {
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  heading: { fontSize: 16, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryBox: {
    flex: 1,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  summaryLabel: { fontSize: 11, color: '#71717a' },
  summaryValue: { fontWeight: '600' },
  barsRow: { flexDirection: 'row', gap: 6, height: 120, alignItems: 'flex-end' },
  barColumn: { flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', backgroundColor: '#18181b', borderRadius: 4 },
  barLabel: { fontSize: 11, color: '#71717a' },
  muscleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  muscleLabel: { width: 72, fontSize: 13 },
  muscleTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: '#f4f4f5' },
  muscleBar: { height: 10, borderRadius: 5, backgroundColor: '#18181b' },
  muscleValue: { width: 24, textAlign: 'right', color: '#71717a', fontSize: 13 },
});
