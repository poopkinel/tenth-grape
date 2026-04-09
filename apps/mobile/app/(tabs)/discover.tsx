import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDiscovery } from '@/hooks/use-discovery';

export default function DiscoverScreen() {
  const { data: users, isLoading, refetch, isRefetching } = useDiscovery();
  const router = useRouter();

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Discover</Text>
      <FlatList
        data={users ?? []}
        keyExtractor={(item) => item.id}
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No players found nearby.</Text>
            <Text style={styles.emptyHint}>Try expanding your travel distance in Profile.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/player/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.distance}>{item.distanceKm} km away</Text>
              </View>
              <View style={styles.freqBadge}>
                <Text style={styles.freqText}>{item.gamingFrequency}</Text>
              </View>
            </View>

            <View style={styles.overlapRow}>
              <Text style={styles.overlapCount}>{item.gameOverlapCount} games in common</Text>
            </View>

            {item.sharedGames.length > 0 && (
              <View style={styles.gamesRow}>
                {item.sharedGames.slice(0, 3).map((g) => (
                  <View key={g.bggId} style={styles.gameChip}>
                    <Text style={styles.gameChipText} numberOfLines={1}>{g.title}</Text>
                  </View>
                ))}
                {item.sharedGames.length > 3 && (
                  <Text style={styles.moreGames}>+{item.sharedGames.length - 3} more</Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptyHint: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
  card: {
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  name: { fontSize: 16, fontWeight: '700', color: '#111' },
  distance: { fontSize: 13, color: '#6b7280', marginTop: 1 },
  freqBadge: { backgroundColor: '#eff6ff', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  freqText: { fontSize: 11, color: '#2563EB', fontWeight: '600', textTransform: 'capitalize' },
  overlapRow: { marginTop: 12 },
  overlapCount: { fontSize: 14, fontWeight: '600', color: '#374151' },
  gamesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  gameChip: { backgroundColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, maxWidth: 140 },
  gameChipText: { fontSize: 12, color: '#374151' },
  moreGames: { fontSize: 12, color: '#9ca3af', alignSelf: 'center' },
});
