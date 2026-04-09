import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMySessions, useCreateSession } from '@/hooks/use-sessions';

type Tab = 'mine' | 'create';

export default function SessionsScreen() {
  const [tab, setTab] = useState<Tab>('mine');
  const { data: sessions, isLoading, refetch, isRefetching } = useMySessions();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sessions</Text>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'mine' && styles.tabActive]}
          onPress={() => setTab('mine')}
        >
          <Text style={[styles.tabText, tab === 'mine' && styles.tabTextActive]}>My Sessions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'create' && styles.tabActive]}
          onPress={() => setTab('create')}
        >
          <Text style={[styles.tabText, tab === 'create' && styles.tabTextActive]}>+ Create</Text>
        </TouchableOpacity>
      </View>

      {tab === 'mine' && (
        isLoading ? (
          <View style={styles.center}><ActivityIndicator size="large" /></View>
        ) : (
          <FlatList
            data={sessions ?? []}
            keyExtractor={(item) => item.id}
            onRefresh={refetch}
            refreshing={isRefetching}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No upcoming sessions</Text>
                <Text style={styles.emptyHint}>Create one or get invited by a match!</Text>
              </View>
            }
            renderItem={({ item }) => {
              const date = new Date(item.scheduledAt);
              const accepted = item.participants?.filter((p: any) => p.status === 'ACCEPTED').length ?? 0;
              return (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => router.push(`/session/${item.id}`)}
                >
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDate}>
                    {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={styles.cardLocation}>{item.locationText}</Text>
                  <Text style={styles.cardPlayers}>{accepted}/{item.maxPlayers} players</Text>
                </TouchableOpacity>
              );
            }}
          />
        )
      )}

      {tab === 'create' && <CreateSessionForm onCreated={() => setTab('mine')} />}
    </View>
  );
}

function CreateSessionForm({ onCreated }: { onCreated: () => void }) {
  const create = useCreateSession();
  const [title, setTitle] = useState('');
  const [locationText, setLocationText] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('4');
  const [scheduledAt, setScheduledAt] = useState('');
  const [description, setDescription] = useState('');

  async function handleCreate() {
    if (!title || !locationText || !scheduledAt) {
      Alert.alert('Error', 'Title, location, and date are required');
      return;
    }

    const parsed = new Date(scheduledAt);
    if (isNaN(parsed.getTime())) {
      Alert.alert('Error', 'Date must be a valid format (e.g. 2026-04-15 19:00)');
      return;
    }

    await create.mutateAsync({
      title,
      locationText,
      lat: 0,
      lng: 0,
      maxPlayers: parseInt(maxPlayers, 10) || 4,
      scheduledAt: parsed.toISOString(),
      description: description || undefined,
    });

    Alert.alert('Created!', 'Your game session has been created.');
    onCreated();
  }

  return (
    <ScrollView contentContainerStyle={styles.form}>
      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Catan Night" placeholderTextColor="#999" />

      <Text style={styles.label}>Date & Time</Text>
      <TextInput style={styles.input} value={scheduledAt} onChangeText={setScheduledAt} placeholder="2026-04-15 19:00" placeholderTextColor="#999" />

      <Text style={styles.label}>Location</Text>
      <TextInput style={styles.input} value={locationText} onChangeText={setLocationText} placeholder="e.g. Board Game Cafe, Tel Aviv" placeholderTextColor="#999" />

      <Text style={styles.label}>Max players</Text>
      <TextInput style={styles.input} value={maxPlayers} onChangeText={setMaxPlayers} keyboardType="number-pad" />

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} multiline placeholder="Any details..." placeholderTextColor="#999" />

      <TouchableOpacity
        style={[styles.createBtn, create.isPending && styles.btnDisabled]}
        onPress={handleCreate}
        disabled={create.isPending}
      >
        {create.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.createBtnText}>Create session</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 8 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  tabActive: { backgroundColor: '#2563EB' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  tabTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptyHint: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
  card: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#f0f0f0' },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardDate: { fontSize: 13, color: '#2563EB', fontWeight: '600' },
  cardLocation: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  cardPlayers: { fontSize: 13, color: '#374151', marginTop: 4, fontWeight: '600' },
  form: { padding: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 15, color: '#000' },
  createBtn: { backgroundColor: '#2563EB', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 24 },
  btnDisabled: { opacity: 0.6 },
  createBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
