import type { DiaryEntry, Food, MealSlot } from '@motusfit/contracts';
import { roundMacrosForDisplay } from '@motusfit/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api } from '../../lib/api';

const SLOTS: { slot: MealSlot; label: string }[] = [
  { slot: 'breakfast', label: 'Café da manhã' },
  { slot: 'lunch', label: 'Almoço' },
  { slot: 'dinner', label: 'Jantar' },
  { slot: 'snack', label: 'Lanches' },
];

export function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;
}

export function DiaryScreen() {
  const date = localToday();
  const queryClient = useQueryClient();
  const dayQuery = useQuery(api.nutrition.diary.listByDay.queryOptions({ input: { date } }));

  const invalidateDay = () =>
    queryClient.invalidateQueries({ queryKey: api.nutrition.diary.listByDay.key() });

  const removeEntry = useMutation(
    api.nutrition.diary.remove.mutationOptions({ onSuccess: invalidateDay }),
  );

  if (dayQuery.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }
  if (dayQuery.isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Erro ao carregar o diário.</Text>
      </View>
    );
  }

  const day = dayQuery.data;
  const totals = roundMacrosForDisplay(day.totals);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.heading}>Hoje ({date})</Text>
        <View style={styles.totalsRow}>
          {(
            [
              ['kcal', totals.kcal, day.goal?.kcal],
              ['P', totals.proteinG, day.goal?.proteinG],
              ['C', totals.carbsG, day.goal?.carbsG],
              ['G', totals.fatG, day.goal?.fatG],
            ] as const
          ).map(([label, value, goal]) => (
            <View key={label} style={styles.totalBox}>
              <Text style={styles.totalLabel}>{label}</Text>
              <Text style={styles.totalValue}>
                {value}
                {goal != null ? ` / ${goal}` : ''}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {SLOTS.map(({ slot, label }) => (
        <MealSection
          key={slot}
          label={label}
          date={date}
          slot={slot}
          entries={day.entries.filter((e) => e.mealSlot === slot)}
          onChanged={invalidateDay}
          onRemove={(id) => removeEntry.mutate({ id })}
        />
      ))}
    </ScrollView>
  );
}

function MealSection({
  label,
  date,
  slot,
  entries,
  onChanged,
  onRemove,
}: {
  label: string;
  date: string;
  slot: MealSlot;
  entries: DiaryEntry[];
  onChanged: () => void;
  onRemove: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>{label}</Text>
      {entries.length === 0 && <Text style={styles.muted}>Nenhuma entrada.</Text>}
      {entries.map((entry) => {
        const macros = roundMacrosForDisplay(entry.macros);
        return (
          <View key={entry.id} style={styles.entryRow}>
            <Text style={styles.entryText}>
              {entry.food.name} — {entry.quantity}
              {entry.food.servingUnit === 'unit' ? ' un' : entry.food.servingUnit}
            </Text>
            <View style={styles.entryMeta}>
              <Text style={styles.muted}>
                {macros.kcal} kcal · P {macros.proteinG}
              </Text>
              <Pressable onPress={() => onRemove(entry.id)}>
                <Text style={styles.remove}>remover</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
      {adding ? (
        <AddEntry
          date={date}
          slot={slot}
          onDone={() => {
            setAdding(false);
            onChanged();
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <Pressable onPress={() => setAdding(true)}>
          <Text style={styles.addLink}>+ Adicionar alimento</Text>
        </Pressable>
      )}
    </View>
  );
}

function AddEntry({
  date,
  slot,
  onDone,
  onCancel,
}: {
  date: string;
  slot: MealSlot;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState('100');

  const searchQuery = useQuery({
    ...api.nutrition.foods.search.queryOptions({ input: { query, limit: 10 } }),
    enabled: !selected && query.length > 0,
  });
  const recentQuery = useQuery({
    ...api.nutrition.foods.recent.queryOptions(),
    enabled: !selected && query === '',
  });

  const addEntry = useMutation(api.nutrition.diary.add.mutationOptions({ onSuccess: onDone }));

  if (selected) {
    return (
      <View style={styles.addRow}>
        <Text style={styles.entryText}>{selected.name}</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={quantity}
          onChangeText={setQuantity}
        />
        <Pressable
          style={styles.button}
          disabled={addEntry.isPending}
          onPress={() =>
            addEntry.mutate({
              date,
              mealSlot: slot,
              foodId: selected.id,
              quantity: Number(quantity),
            })
          }
        >
          <Text style={styles.buttonText}>Adicionar</Text>
        </Pressable>
        <Pressable onPress={() => setSelected(null)}>
          <Text style={styles.addLink}>voltar</Text>
        </Pressable>
      </View>
    );
  }

  const foods = query === '' ? recentQuery.data : searchQuery.data;

  return (
    <View>
      <View style={styles.addRow}>
        <TextInput
          style={[styles.input, styles.inputGrow]}
          placeholder="Buscar alimento…"
          value={query}
          onChangeText={setQuery}
        />
        <Pressable onPress={onCancel}>
          <Text style={styles.addLink}>fechar</Text>
        </Pressable>
      </View>
      <FlatList
        data={foods ?? []}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => setSelected(item)}>
            <Text style={styles.foodOption}>
              {item.isFavorite ? '★ ' : ''}
              {item.name} — {item.kcal} kcal
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  heading: { fontSize: 16, fontWeight: '600' },
  totalsRow: { flexDirection: 'row', gap: 8 },
  totalBox: {
    flex: 1,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  totalLabel: { fontSize: 11, color: '#71717a' },
  totalValue: { fontWeight: '600' },
  entryRow: { gap: 2 },
  entryText: { fontSize: 14 },
  entryMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  muted: { color: '#71717a', fontSize: 13 },
  remove: { color: '#dc2626', fontSize: 13 },
  error: { color: '#dc2626' },
  addLink: { color: '#52525b', textDecorationLine: 'underline', marginTop: 4 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 70,
  },
  inputGrow: { flex: 1 },
  button: {
    backgroundColor: '#18181b',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  buttonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  foodOption: { paddingVertical: 6, fontSize: 14 },
});
