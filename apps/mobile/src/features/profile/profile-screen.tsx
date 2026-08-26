import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../../lib/api';

export function ProfileScreen() {
  const queryClient = useQueryClient();
  const profileQuery = useQuery(api.identity.profile.get.queryOptions());
  const [displayName, setDisplayName] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profileQuery.data) return;
    setDisplayName(profileQuery.data.displayName);
  }, [profileQuery.data]);

  const saveProfile = useMutation(
    api.identity.profile.upsert.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: api.identity.profile.get.key() });
        setSaved(true);
      },
    }),
  );

  if (profileQuery.isPending) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nome</Text>
      <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />

      <Pressable
        style={styles.button}
        disabled={saveProfile.isPending || !displayName}
        onPress={() => {
          setSaved(false);
          saveProfile.mutate({
            displayName,
          });
        }}
      >
        <Text style={styles.buttonText}>Salvar</Text>
      </Pressable>
      {saved && <Text style={styles.saved}>Salvo.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 4 },
  label: { fontSize: 13, color: '#71717a', marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  button: {
    marginTop: 16,
    backgroundColor: '#18181b',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  saved: { marginTop: 8, color: '#15803d', fontSize: 13 },
});
