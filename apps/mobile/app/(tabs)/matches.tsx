import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMatches, useUnmatch } from '@/hooks/use-matches';

export default function MatchesScreen() {
  const { data: matches, isLoading, refetch, isRefetching } = useMatches();
  const unmatch = useUnmatch();
  const router = useRouter();

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Matches</Text>
      <FlatList
        data={matches ?? []}
        keyExtractor={(item) => item.id}
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No matches yet</Text>
            <Text style={styles.emptyHint}>Discover players and like them to match!</Text>
          </View>
        }
        renderItem={({ item }) => {
          const initials = item.otherUser.name
            .split(' ')
            .map((w: string) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          const timeAgo = item.lastMessage
            ? formatTimeAgo(item.lastMessage.createdAt)
            : formatTimeAgo(item.createdAt);

          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push(`/chat/${item.id}`)}
              onLongPress={() => {
                Alert.alert(
                  'Unmatch',
                  `Remove ${item.otherUser.name} from your matches?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Unmatch',
                      style: 'destructive',
                      onPress: () => unmatch.mutate(item.id),
                    },
                  ],
                );
              }}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.otherUser.name}</Text>
                <Text style={styles.preview} numberOfLines={1}>
                  {item.lastMessage
                    ? item.lastMessage.content
                    : 'Say hello!'}
                </Text>
              </View>
              <Text style={styles.time}>{timeAgo}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptyHint: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#111' },
  preview: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  time: { fontSize: 12, color: '#9ca3af' },
});
