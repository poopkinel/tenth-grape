import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useMySessions } from '@/hooks/use-sessions';

export default function PlayScreen() {
  const { data: sessions, isLoading, refetch, isRefetching } = useMySessions();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Play</Text>
      <Text style={styles.subtitle}>Log a game or plan a session</Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#16a34a' }]}
          onPress={() => router.push('/log-play')}
        >
          <Text style={styles.actionEmoji}>🎲</Text>
          <Text style={styles.actionLabel}>Log a play</Text>
          <Text style={styles.actionHint}>Record a game you just played</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#2563EB' }]}
          onPress={() => router.push('/session/create')}
        >
          <Text style={styles.actionEmoji}>📅</Text>
          <Text style={styles.actionLabel}>Plan a session</Text>
          <Text style={styles.actionHint}>Schedule a future game night</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Upcoming</Text>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={(sessions ?? []).filter((s: any) => s.status === 'PLANNED')}
          keyExtractor={(s) => s.id}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <Text style={styles.empty}>No upcoming sessions</Text>
          }
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const date = new Date(item.scheduledAt);
            const accepted = (item.participants ?? []).filter(
              (p: any) => p.status === 'ACCEPTED',
            ).length;
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/session/${item.id}`)}
              >
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDate}>
                  {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.cardLocation}>📍 {item.locationText}</Text>
                <Text style={styles.cardPlayers}>{accepted}/{item.maxPlayers} players</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '800', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 2 },
  subtitle: { fontSize: 14, color: '#6b7280', paddingHorizontal: 20, paddingBottom: 16 },
  actions: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 24 },
  actionBtn: { flex: 1, borderRadius: 14, padding: 16, alignItems: 'center' },
  actionEmoji: { fontSize: 32, marginBottom: 4 },
  actionLabel: { color: '#fff', fontSize: 15, fontWeight: '700' },
  actionHint: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 2, textAlign: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700', paddingHorizontal: 20, marginBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { textAlign: 'center', color: '#9ca3af', paddingTop: 20, paddingHorizontal: 20 },
  card: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardDate: { fontSize: 13, color: '#2563EB', fontWeight: '600', marginTop: 2 },
  cardLocation: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  cardPlayers: { fontSize: 13, color: '#374151', marginTop: 4, fontWeight: '600' },
});
