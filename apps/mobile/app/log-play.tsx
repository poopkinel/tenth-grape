import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCreatePost } from '@/hooks/use-posts';
import { useSearchGames } from '@/hooks/use-user';
import { PostType } from '@meeple/shared';
import type { GameSearchResultDto } from '@meeple/shared';

interface PickedGame {
  bggId: number;
  title: string;
  thumbnail: string | null;
}

export default function LogPlayScreen() {
  const router = useRouter();
  const createPost = useCreatePost();
  const [notes, setNotes] = useState('');
  const [query, setQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [picked, setPicked] = useState<PickedGame[]>([]);

  const { data: searchResults, isFetching } = useSearchGames(activeSearch);

  function addGame(g: GameSearchResultDto) {
    if (picked.find((p) => p.bggId === g.bggId)) return;
    setPicked((prev) => [...prev, { bggId: g.bggId, title: g.title, thumbnail: (g as any).thumbnail ?? null }]);
    setQuery('');
    setActiveSearch('');
  }

  function removeGame(bggId: number) {
    setPicked((prev) => prev.filter((p) => p.bggId !== bggId));
  }

  async function submit() {
    if (picked.length === 0 && !notes.trim()) {
      Alert.alert('Nothing to log', 'Add a game or write some notes about the play.');
      return;
    }
    try {
      await createPost.mutateAsync({
        type: PostType.PLAY_LOG,
        content: notes.trim() || undefined,
        bggIds: picked.map((p) => p.bggId),
      });
      Alert.alert('Logged', 'Your play is in the feed!');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not log play');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.hint}>Add the games you played, and jot down anything memorable.</Text>

      <Text style={styles.label}>Games</Text>
      {picked.map((g) => (
        <View key={g.bggId} style={styles.pickedRow}>
          {g.thumbnail && <Image source={{ uri: g.thumbnail }} style={styles.thumb} />}
          <Text style={styles.pickedTitle}>{g.title}</Text>
          <TouchableOpacity onPress={() => removeGame(g.bggId)}>
            <Text style={styles.removeBtn}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Search for a game..."
          placeholderTextColor="#999"
          onSubmitEditing={() => setActiveSearch(query)}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={() => setActiveSearch(query)}>
          <Text style={styles.searchBtnText}>Go</Text>
        </TouchableOpacity>
      </View>

      {isFetching && <ActivityIndicator style={{ marginTop: 8 }} />}

      {searchResults && searchResults.length > 0 && (
        <View style={styles.resultsList}>
          {searchResults.slice(0, 8).map((g) => (
            <TouchableOpacity key={g.bggId} style={styles.resultRow} onPress={() => addGame(g)}>
              <Text style={styles.resultText} numberOfLines={1}>{g.title}</Text>
              <Text style={styles.addIcon}>+</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, styles.notes]}
        value={notes}
        onChangeText={setNotes}
        multiline
        placeholder="How did it go? Who won?"
        placeholderTextColor="#999"
      />

      <TouchableOpacity
        style={[styles.submitBtn, createPost.isPending && styles.btnDisabled]}
        onPress={submit}
        disabled={createPost.isPending}
      >
        {createPost.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Post to feed</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  hint: { fontSize: 13, color: '#6b7280', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 14 },
  pickedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  thumb: { width: 36, height: 36, borderRadius: 6 },
  pickedTitle: { flex: 1, fontSize: 14, fontWeight: '600' },
  removeBtn: { fontSize: 18, color: '#ef4444', padding: 4 },
  searchRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 15, color: '#000' },
  searchBtn: { backgroundColor: '#2563EB', borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '700' },
  resultsList: { marginTop: 4 },
  resultRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 8 },
  resultText: { flex: 1, fontSize: 14 },
  addIcon: { fontSize: 20, color: '#2563EB', fontWeight: '700' },
  notes: { height: 100, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#16a34a', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 24 },
  btnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
