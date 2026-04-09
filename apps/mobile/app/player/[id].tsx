import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useLike } from '@/hooks/use-discovery';
import type { DiscoveryUserDto } from '@meeple/shared';

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const like = useLike();
  const [liked, setLiked] = useState(false);

  // Get player data from discovery cache
  const discovery = qc.getQueryData<DiscoveryUserDto[]>(['discovery']);
  const player = discovery?.find((u) => u.id === id);

  if (!player) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Player not found</Text>
      </View>
    );
  }

  const initials = player.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  async function handleLike() {
    const result = await like.mutateAsync(id);
    setLiked(true);

    if (result.matched) {
      Alert.alert(
        "It's a match!",
        `You and ${player!.name} both want to play together!`,
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Start chatting',
            onPress: () => router.replace(`/chat/${result.matchId}`),
          },
        ],
      );
    } else {
      Alert.alert('Liked!', `${player!.name} will see your interest if they like you too.`);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{player.name}</Text>
        <Text style={styles.distance}>{player.distanceKm} km away</Text>
        <View style={styles.freqBadge}>
          <Text style={styles.freqText}>{player.gamingFrequency}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        {player.gameOverlapCount} games in common
      </Text>

      {player.sharedGames.map((g) => (
        <View key={g.bggId} style={styles.gameRow}>
          <Text style={styles.gameTitle}>{g.title}</Text>
        </View>
      ))}

      {player.sharedGames.length === 0 && (
        <Text style={styles.noGames}>No shared games yet</Text>
      )}

      <TouchableOpacity
        style={[styles.likeBtn, (liked || like.isPending) && styles.likeBtnDisabled]}
        onPress={handleLike}
        disabled={liked || like.isPending}
      >
        {like.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.likeBtnText}>{liked ? 'Liked' : 'Like'}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingTop: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#9ca3af' },
  header: { alignItems: 'center', marginBottom: 32 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: '800' },
  name: { fontSize: 24, fontWeight: '800' },
  distance: { fontSize: 15, color: '#6b7280', marginTop: 4 },
  freqBadge: { backgroundColor: '#eff6ff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5, marginTop: 8 },
  freqText: { fontSize: 13, color: '#2563EB', fontWeight: '600', textTransform: 'capitalize' },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  gameRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  gameTitle: { fontSize: 15 },
  noGames: { fontSize: 14, color: '#9ca3af', paddingVertical: 12 },
  likeBtn: { backgroundColor: '#2563EB', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 32 },
  likeBtnDisabled: { backgroundColor: '#93c5fd' },
  likeBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
