import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ProfileScreen } from './src/features/profile/profile-screen';
import { WeeklyStatsScreen } from './src/features/stats/weekly-stats-screen';
import { SessionScreen } from './src/features/workout/session-screen';
import { WorkoutsScreen } from './src/features/workout/workouts-screen';
import { localToday } from './src/lib/date';

// Navegação por estado; Expo Router entra quando as telas se multiplicarem (ADR 0006).
export default function App() {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <Root />
    </QueryClientProvider>
  );
}

type Tab = 'workouts' | 'stats' | 'profile';

function Root() {
  const [tab, setTab] = useState<Tab>('workouts');
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);

  return (
    <View style={styles.app}>
      <View style={styles.header}>
        <Text style={styles.title}>MotusFit</Text>
      </View>

      {openSessionId ? (
        <SessionScreen sessionId={openSessionId} onBack={() => setOpenSessionId(null)} />
      ) : (
        <>
          <View style={styles.tabs}>
            {(
              [
                ['workouts', 'Treinos'],
                ['stats', 'Estatísticas'],
                ['profile', 'Perfil'],
              ] as const
            ).map(([value, label]) => (
              <Pressable
                key={value}
                style={[styles.tab, tab === value && styles.tabActive]}
                onPress={() => setTab(value)}
              >
                <Text style={tab === value ? styles.tabTextActive : styles.tabText}>{label}</Text>
              </Pressable>
            ))}
          </View>
          {tab === 'workouts' && <WorkoutsScreen onOpenSession={setOpenSessionId} />}
          {tab === 'stats' && <WeeklyStatsScreen date={localToday()} />}
          {tab === 'profile' && <ProfileScreen />}
        </>
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: '#fff', paddingTop: 56 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '700' },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 4 },
  tab: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  tabActive: { backgroundColor: '#18181b', borderColor: '#18181b' },
  tabText: { color: '#3f3f46' },
  tabTextActive: { color: '#fff', fontWeight: '600' },
});
