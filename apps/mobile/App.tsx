import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthScreen } from './src/features/auth/auth-screen';
import { signOut, useSession } from './src/lib/auth-client';

// Navegação por estado enquanto o app tem 2 telas; Expo Router entra na Fase 3
// junto com as telas de diário/treino (ADR 0006).
export default function App() {
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
    <View style={styles.center}>
      <Text style={styles.title}>Olá, {session.user.name}</Text>
      <Text style={styles.subtitle}>Diário e treinos chegam nas Fases 3 e 4.</Text>
      <Pressable style={styles.button} onPress={() => signOut()}>
        <Text style={styles.buttonText}>Sair</Text>
      </Pressable>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#52525b',
  },
  button: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: {
    fontSize: 16,
  },
});
