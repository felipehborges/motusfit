import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthScreen } from './src/features/auth/auth-screen';
import { DiaryScreen } from './src/features/diary/diary-screen';
import { SessionScreen } from './src/features/workout/session-screen';
import { WorkoutsScreen } from './src/features/workout/workouts-screen';
import { signOut, useSession } from './src/lib/auth-client';

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

type Tab = 'diary' | 'workouts';

function Root() {
  const { data: session, isPending } = useSession();
  const [tab, setTab] = useState<Tab>('diary');
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);

  if (isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return (
      <>
        <AuthScreen />
        <StatusBar style="auto" />
      </>
    );
  }

  return (
    <View style={styles.app}>
      <View style={styles.header}>
        <Text style={styles.title}>MotusFit</Text>
        <Pressable onPress={() => signOut()}>
          <Text style={styles.signOut}>Sair</Text>
        </Pressable>
      </View>

      {openSessionId ? (
        <SessionScreen sessionId={openSessionId} onBack={() => setOpenSessionId(null)} />
      ) : (
        <>
          <View style={styles.tabs}>
            {(
              [
                ['diary', 'Diário'],
                ['workouts', 'Treinos'],
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
          {tab === 'diary' ? <DiaryScreen /> : <WorkoutsScreen onOpenSession={setOpenSessionId} />}
        </>
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  app: { flex: 1, backgroundColor: '#fff', paddingTop: 56 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '700' },
  signOut: { color: '#52525b', textDecorationLine: 'underline' },
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
