import { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useFeed } from '@/hooks/use-feed';
import { useReact, useUnreact } from '@/hooks/use-posts';
import type { PostDto } from '@meeple/shared';

const REACTION_EMOJIS = ['👍', '❤️', '🎲', '☕', '😂', '🎉'];

export default function FeedScreen() {
  const { t } = useTranslation();
  const { data, isLoading, refetch, isRefetching, fetchNextPage, hasNextPage } = useFeed();
  const router = useRouter();
  const react = useReact();
  const unreact = useUnreact();

  const posts = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );

  function handleReact(post: PostDto, emoji: string) {
    const current = post.reactions.find((r) => r.mine);
    if (current?.emoji === emoji) {
      // tapping same emoji again removes it
      unreact.mutate(post.id);
    } else {
      react.mutate({ postId: post.id, emoji });
    }
  }

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('feed.title')}</Text>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        onRefresh={refetch}
        refreshing={isRefetching}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('feed.emptyTitle')}</Text>
            <Text style={styles.emptyHint}>{t('feed.emptyHint')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/post/${item.id}`)}
            activeOpacity={0.85}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.author.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.authorName}>{item.author.name}</Text>
                <Text style={styles.timeAgo}>{formatTimeAgo(item.createdAt, t)}</Text>
              </View>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{formatPostType(item.type, t)}</Text>
              </View>
            </View>

            {/* Content */}
            {item.content && <Text style={styles.content}>{item.content}</Text>}

            {/* Games played */}
            {item.games.length > 0 && (
              <View style={styles.gamesRow}>
                {item.games.map((g) => (
                  <View key={g.bggId} style={styles.gamePill}>
                    {g.thumbnail && (
                      <Image source={{ uri: g.thumbnail }} style={styles.gameThumb} />
                    )}
                    <Text style={styles.gamePillText} numberOfLines={1}>{g.title}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Reaction bar */}
            <View style={styles.reactionsRow}>
              {REACTION_EMOJIS.map((emoji) => {
                const summary = item.reactions.find((r) => r.emoji === emoji);
                const mine = summary?.mine ?? false;
                const count = summary?.count ?? 0;
                return (
                  <TouchableOpacity
                    key={emoji}
                    style={[styles.reactionBtn, mine && styles.reactionBtnActive]}
                    onPress={() => handleReact(item, emoji)}
                  >
                    <Text style={styles.reactionEmoji}>{emoji}</Text>
                    {count > 0 && (
                      <Text style={[styles.reactionCount, mine && styles.reactionCountActive]}>
                        {count}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
              {item.commentCount > 0 && (
                <View style={styles.commentCount}>
                  <Text style={styles.commentCountText}>💬 {item.commentCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

function formatPostType(type: string, t: TranslateFn): string {
  return t(`feed.postType.${type}`, { defaultValue: 'Post' });
}

function formatTimeAgo(dateStr: string, t: TranslateFn): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('feed.timeAgo.now');
  if (mins < 60) return t('feed.timeAgo.minutes', { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('feed.timeAgo.hours', { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 30) return t('feed.timeAgo.days', { count: days });
  return new Date(dateStr).toLocaleDateString();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptyHint: { fontSize: 14, color: '#9ca3af', marginTop: 4, textAlign: 'center' },

  card: {
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  authorName: { fontSize: 15, fontWeight: '700', color: '#111' },
  timeAgo: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  typeBadge: { backgroundColor: '#eff6ff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeText: { fontSize: 11, color: '#2563EB', fontWeight: '600' },

  content: { fontSize: 15, color: '#111', lineHeight: 21, marginBottom: 10 },

  gamesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  gamePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingRight: 10,
    paddingVertical: 4,
    paddingLeft: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxWidth: 200,
  },
  gameThumb: { width: 24, height: 24, borderRadius: 4 },
  gamePillText: { fontSize: 13, color: '#374151', flexShrink: 1 },

  reactionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 4,
  },
  reactionBtnActive: { backgroundColor: '#eff6ff', borderColor: '#2563EB' },
  reactionEmoji: { fontSize: 14 },
  reactionCount: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  reactionCountActive: { color: '#2563EB' },
  commentCount: { marginLeft: 'auto', justifyContent: 'center' },
  commentCountText: { fontSize: 12, color: '#9ca3af' },
});
