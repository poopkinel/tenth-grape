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
import { useFeed, type FeedEmptyState, type OpenInvitation } from '@/hooks/use-feed';
import { useReact, useUnreact } from '@/hooks/use-posts';
import type { PostDto, EventDto } from '@meeple/shared';

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

  const emptyState = data?.pages[0]?.emptyState ?? null;

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
          emptyState ? (
            <DiscoveryView emptyState={emptyState} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t('feed.emptyTitle')}</Text>
              <Text style={styles.emptyHint}>{t('feed.emptyHint')}</Text>
            </View>
          )
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

/**
 * Empty-state discovery view: shown instead of the barren "nothing here" text
 * when the user has no posts from friends/groups yet. Surfaces community
 * events, open game invitations, and the upcoming marketplace.
 */
function DiscoveryView({ emptyState }: { emptyState: FeedEmptyState }) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.discovery}>
      <Text style={styles.discoveryHeading}>{t('feed.discovery.heading')}</Text>

      {/* Upcoming events */}
      <Text style={styles.sectionTitle}>📅 {t('feed.discovery.upcomingEvents')}</Text>
      {emptyState.events.length === 0 ? (
        <Text style={styles.sectionEmpty}>{t('feed.discovery.noEvents')}</Text>
      ) : (
        emptyState.events.map((ev: EventDto) => {
          const date = new Date(ev.startAt);
          return (
            <TouchableOpacity
              key={ev.id}
              style={styles.discoveryCard}
              onPress={() => router.push(`/event/${ev.id}`)}
            >
              <Text style={styles.discoveryCardTitle}>{ev.title}</Text>
              <Text style={styles.discoveryCardMeta}>
                {date.toLocaleDateString()} · {ev.locationText}
              </Text>
              {ev.featuredGames && ev.featuredGames.length > 0 && (
                <View style={styles.invGamesRow}>
                  {ev.featuredGames.slice(0, 3).map((g) => (
                    <View key={g.bggId} style={styles.invGamePill}>
                      {g.thumbnail ? (
                        <Image source={{ uri: g.thumbnail }} style={styles.invGameThumb} />
                      ) : null}
                      <Text style={styles.invGameText} numberOfLines={1}>{g.title}</Text>
                    </View>
                  ))}
                </View>
              )}
              <Text style={styles.discoveryCardFooter}>
                {ev.attendeeCount} going
              </Text>
            </TouchableOpacity>
          );
        })
      )}

      {/* Open game invitations */}
      <Text style={styles.sectionTitle}>🎲 {t('feed.discovery.openInvitations')}</Text>
      {emptyState.openInvitations.length === 0 ? (
        <Text style={styles.sectionEmpty}>{t('feed.discovery.noInvitations')}</Text>
      ) : (
        emptyState.openInvitations.map((inv: OpenInvitation) => {
          const date = new Date(inv.scheduledAt);
          const spotsOpen = inv.maxPlayers - inv.accepted;
          return (
            <TouchableOpacity
              key={inv.id}
              style={styles.discoveryCard}
              onPress={() => router.push(`/session/${inv.id}`)}
            >
              <Text style={styles.discoveryCardTitle}>{inv.title}</Text>
              <Text style={styles.discoveryCardMeta}>
                {date.toLocaleDateString()} · {inv.locationText}
              </Text>
              {inv.host && (
                <Text style={styles.discoveryCardMeta}>
                  {t('feed.discovery.hostedBy', { name: inv.host.name })}
                </Text>
              )}
              {inv.games.length > 0 && (
                <View style={styles.invGamesRow}>
                  {inv.games.slice(0, 3).map((g) => (
                    <View key={g.bggId} style={styles.invGamePill}>
                      {g.thumbnail ? (
                        <Image source={{ uri: g.thumbnail }} style={styles.invGameThumb} />
                      ) : null}
                      <Text style={styles.invGameText} numberOfLines={1}>
                        {g.title}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              <Text style={styles.discoverySpots}>
                {t('feed.discovery.spotsLeft', { open: spotsOpen, total: inv.maxPlayers })}
              </Text>
            </TouchableOpacity>
          );
        })
      )}

      {/* Marketplace placeholder */}
      {emptyState.marketplaceComingSoon && (
        <>
          <Text style={styles.sectionTitle}>🏷️ {t('feed.discovery.marketplace')}</Text>
          <View style={[styles.discoveryCard, styles.comingSoonCard]}>
            <Text style={styles.comingSoonText}>
              {t('feed.discovery.marketplaceComingSoon')}
            </Text>
          </View>
        </>
      )}
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

  // ─── Discovery empty-state view ────────────────────────────────────────
  discovery: { paddingTop: 8 },
  discoveryHeading: { fontSize: 15, color: '#6b7280', marginBottom: 16, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginTop: 16, marginBottom: 10 },
  sectionEmpty: { fontSize: 13, color: '#9ca3af', paddingVertical: 12, paddingHorizontal: 4 },
  discoveryCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  discoveryCardTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  discoveryCardMeta: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  discoveryCardFooter: { fontSize: 13, color: '#2563EB', fontWeight: '600', marginTop: 6 },
  discoverySpots: { fontSize: 13, color: '#16a34a', fontWeight: '600', marginTop: 8 },
  invGamesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  invGamePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingRight: 8,
    paddingVertical: 3,
    paddingLeft: 3,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxWidth: 180,
  },
  invGameThumb: { width: 22, height: 22, borderRadius: 4 },
  invGameText: { fontSize: 12, color: '#374151', flexShrink: 1 },
  comingSoonCard: { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
  comingSoonText: { fontSize: 13, color: '#92400e', lineHeight: 19 },

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
