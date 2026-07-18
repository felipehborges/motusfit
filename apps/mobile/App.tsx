import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthScreen } from './src/features/auth/auth-screen';
import { DiaryScreen } from './src/features/diary/diary-screen';
import { signOut, useSession } from './src/lib/auth-client';

// Navegação por estado enquanto o app tem poucas telas; Expo Router entra
// junto com as telas de treino (Fase 4) — ADR 0006.
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

function Root() {
  const { data: session, isPending } = useSession();

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
      <DiaryScreen />
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
});
