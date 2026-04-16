import { useEffect, useState } from 'react';
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
import * as Location from 'expo-location';
import { useMyEvents, useNearbyEvents } from '@/hooks/use-events';
import type { EventDto } from '@meeple/shared';

type Tab = 'mine' | 'nearby';

export default function EventsScreen() {
  const [tab, setTab] = useState<Tab>('nearby');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const router = useRouter();

  const myEvents = useMyEvents();
  const nearbyEvents = useNearbyEvents(location?.lat ?? null, location?.lng ?? null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const req = await Location.requestForegroundPermissionsAsync();
        if (req.status !== 'granted') return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, []);

  const active = tab === 'mine' ? myEvents : nearbyEvents;
  const events = (active.data ?? []) as EventDto[];

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Events</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push('/event/create')}
        >
          <Text style={styles.createBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'nearby' && styles.tabActive]}
          onPress={() => setTab('nearby')}
        >
          <Text style={[styles.tabText, tab === 'nearby' && styles.tabTextActive]}>Nearby</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'mine' && styles.tabActive]}
          onPress={() => setTab('mine')}
        >
          <Text style={[styles.tabText, tab === 'mine' && styles.tabTextActive]}>My events</Text>
        </TouchableOpacity>
      </View>

      {active.isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" /></View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(e) => e.id}
          onRefresh={active.refetch}
          refreshing={active.isRefetching}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {tab === 'nearby' ? 'No upcoming events nearby.' : "You're not attending any events yet."}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/event/${item.id}`)}
            >
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardTime}>{formatEventTime(item.startAt)}</Text>
              <Text style={styles.cardLocation}>📍 {item.locationText}</Text>

              {item.featuredGames && item.featuredGames.length > 0 && (
                <View style={styles.gamesRow}>
                  {item.featuredGames.slice(0, 4).map((g) => (
                    <View key={g.bggId} style={styles.gamePill}>
                      {g.thumbnail ? (
                        <Image source={{ uri: g.thumbnail }} style={styles.gameThumb} />
                      ) : null}
                      <Text style={styles.gamePillText} numberOfLines={1}>{g.title}</Text>
                    </View>
                  ))}
                  {item.featuredGames.length > 4 && (
                    <Text style={styles.moreGames}>+{item.featuredGames.length - 4}</Text>
                  )}
                </View>
              )}

              <View style={styles.cardFooter}>
                <Text style={styles.attendeeCount}>
                  {item.attendeeCount} going
                  {item.capacity ? ` / ${item.capacity}` : ''}
                </Text>
                {item.myStatus && (
                  <View style={[styles.myStatus, myStatusStyle(item.myStatus)]}>
                    <Text style={styles.myStatusText}>{item.myStatus}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

function formatEventTime(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function myStatusStyle(status: string) {
  if (status === 'GOING' || status === 'ATTENDED') return { backgroundColor: '#dcfce7' };
  if (status === 'INTERESTED') return { backgroundColor: '#fef3c7' };
  return {};
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
    paddingBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '800' },
  createBtn: { backgroundColor: '#2563EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  createBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  tabActive: { backgroundColor: '#2563EB' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  tabTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
  card: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardTime: { fontSize: 13, color: '#2563EB', fontWeight: '600' },
  cardLocation: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  gamesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  gamePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingRight: 8,
    paddingVertical: 3,
    paddingLeft: 3,
    gap: 5,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxWidth: 160,
  },
  gameThumb: { width: 22, height: 22, borderRadius: 4 },
  gamePillText: { fontSize: 12, color: '#374151', flexShrink: 1 },
  moreGames: { fontSize: 12, color: '#9ca3af', alignSelf: 'center' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  attendeeCount: { fontSize: 13, color: '#374151', fontWeight: '600' },
  myStatus: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  myStatusText: { fontSize: 11, fontWeight: '700', color: '#111' },
});
