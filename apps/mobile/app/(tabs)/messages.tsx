import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useConversations, useOpenConversation } from '@/hooks/use-conversations';
import { useFriends } from '@/hooks/use-friendships';

export default function MessagesScreen() {
  const { data: conversations, isLoading, refetch, isRefetching } = useConversations();
  const { data: friends } = useFriends();
  const openConversation = useOpenConversation();
  const router = useRouter();

  function handleStartDmWithFriend() {
    if (!friends?.length) {
      Alert.alert('No friends yet', 'Add some friends first to start a conversation.');
      return;
    }

    // Simple picker via Alert. For MVP we'll pop options of friends.
    // TODO: replace with a proper picker screen once friends list grows.
    Alert.alert(
      'Pick a friend',
      undefined,
      friends.slice(0, 5).map((f) => ({
        text: f.otherUser.name,
        onPress: async () => {
          const conv = await openConversation.mutateAsync(f.otherUser.id);
          router.push(`/chat/${conv.id}`);
        },
      })).concat([{ text: 'Cancel', onPress: async () => {} }]),
    );
  }

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.newBtn} onPress={handleStartDmWithFriend}>
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations ?? []}
        keyExtractor={(c) => c.id}
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptyHint}>Tap + New to message a friend</Text>
          </View>
        }
        renderItem={({ item }) => {
          const initials = item.otherUser.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push(`/chat/${item.id}`)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.otherUser.name}</Text>
                <Text style={styles.preview} numberOfLines={1}>
                  {item.lastMessage?.content ?? 'Say hello!'}
                </Text>
              </View>
              {item.lastMessage && (
                <Text style={styles.time}>{formatTime(item.lastMessage.createdAt)}</Text>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
  },
  title: { fontSize: 28, fontWeight: '800' },
  newBtn: { backgroundColor: '#2563EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  newBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptyHint: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  name: { fontSize: 15, fontWeight: '700', color: '#111' },
  preview: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  time: { fontSize: 12, color: '#9ca3af' },
});
