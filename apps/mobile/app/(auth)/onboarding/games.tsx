import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { authedApi } from '@/lib/api';
import { GameOwnership } from '@meeple/shared';
import type { GameSearchResultDto } from '@meeple/shared';

export default function GamesStep() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [adding, setAdding] = useState<number | null>(null);
  const router = useRouter();

  const { data: results, isFetching } = useQuery({
    queryKey: ['bgg-search', search],
    queryFn: () => authedApi.get<GameSearchResultDto[]>(`/games/search?q=${encodeURIComponent(search)}`),
    enabled: search.length > 1,
  });

  async function handleAdd(game: GameSearchResultDto) {
    setAdding(game.bggId);
    try {
      await authedApi.post('/users/me/games', {
        bggId: game.bggId,
        ownership: GameOwnership.OWN,
      });
      setAddedIds((prev) => new Set(prev).add(game.bggId));
    } catch {
      Alert.alert(t('common.error'), t('auth.onboarding.games.addFailed'));
    } finally {
      setAdding(null);
    }
  }

  function handleDone() {
    router.replace('/(tabs)/feed');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('auth.onboarding.games.title')}</Text>
      <Text style={styles.subtitle}>{t('auth.onboarding.games.subtitle')}</Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder={t('auth.onboarding.games.searchPlaceholder')}
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => setSearch(query)}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={() => setSearch(query)}>
          <Text style={styles.searchBtnText}>{t('auth.onboarding.games.go')}</Text>
        </TouchableOpacity>
      </View>

      {isFetching && <ActivityIndicator style={{ marginTop: 16 }} />}

      <FlatList
        data={results ?? []}
        keyExtractor={(item) => String(item.bggId)}
        renderItem={({ item }) => {
          const added = addedIds.has(item.bggId);
          const isAdding = adding === item.bggId;
          return (
            <View style={styles.gameRow}>
              {item.thumbnail ? (
                <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
              ) : (
                <View style={[styles.thumbnail, styles.thumbnailPlaceholder]} />
              )}
              <View style={styles.gameInfo}>
                <Text style={styles.gameTitle} numberOfLines={2}>{item.title}</Text>
                {item.yearPublished && (
                  <Text style={styles.gameYear}>{item.yearPublished}</Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.addBtn, added && styles.addBtnDone]}
                onPress={() => !added && handleAdd(item)}
                disabled={added || isAdding}
              >
                {isAdding ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.addBtnText}>{added ? '✓' : '+'}</Text>
                )}
              </TouchableOpacity>
            </View>
          );
        }}
        style={styles.list}
      />

      <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
        <Text style={styles.doneBtnText}>
          {addedIds.size > 0
            ? t('auth.onboarding.games.doneCount', { count: addedIds.size })
            : t('common.skip')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 32 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#000',
  },
  searchBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '700' },
  list: { flex: 1 },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  thumbnail: { width: 48, height: 48, borderRadius: 8 },
  thumbnailPlaceholder: { backgroundColor: '#e5e7eb' },
  gameInfo: { flex: 1 },
  gameTitle: { fontSize: 14, fontWeight: '600', color: '#111' },
  gameYear: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnDone: { backgroundColor: '#16a34a' },
  addBtnText: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 22 },
  doneBtn: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
