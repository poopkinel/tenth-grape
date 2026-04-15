import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth.store';
import { useMe, useUpdateProfile, useMyGames, useAddGame, useRemoveGame, useSearchGames } from '@/hooks/use-user';
import { LanguageSwitcher } from '@/components/language-switcher';
import { GamingFrequency, GameOwnership } from '@meeple/shared';

const TRAVEL_OPTIONS = [5, 10, 25, 50, 100];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { logout } = useAuthStore();

  const FREQ_OPTIONS = [
    { value: GamingFrequency.CASUAL, label: t('auth.onboarding.preferences.frequencyCasual') },
    { value: GamingFrequency.REGULAR, label: t('auth.onboarding.preferences.frequencyRegular') },
    { value: GamingFrequency.HEAVY, label: t('auth.onboarding.preferences.frequencyHeavy') },
  ];
  const { data: me, isLoading: meLoading } = useMe();
  const { data: games, isLoading: gamesLoading } = useMyGames();
  const updateProfile = useUpdateProfile();
  const addGame = useAddGame();
  const removeGame = useRemoveGame();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [frequency, setFrequency] = useState<GamingFrequency>(GamingFrequency.CASUAL);
  const [maxTravelKm, setMaxTravelKm] = useState(25);
  const [initialized, setInitialized] = useState(false);

  // Game search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const { data: searchResults, isFetching: searching } = useSearchGames(activeSearch);

  useEffect(() => {
    if (me && !initialized) {
      setName(me.name ?? '');
      setBio(me.profile?.bio ?? '');
      setFrequency(me.profile?.gamingFrequency ?? GamingFrequency.CASUAL);
      setMaxTravelKm(me.profile?.maxTravelKm ?? 25);
      setInitialized(true);
    }
  }, [me, initialized]);

  async function handleSave() {
    await updateProfile.mutateAsync({ name, bio, gamingFrequency: frequency, maxTravelKm });
    Alert.alert(t('profile.saved'), t('profile.profileUpdated'));
  }

  async function handleAddGame(bggId: number) {
    await addGame.mutateAsync({ bggId, ownership: GameOwnership.OWN });
    setShowSearch(false);
    setSearchQuery('');
    setActiveSearch('');
  }

  if (meLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  const initials = (me?.name ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar + Name */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.email}>{me?.email}</Text>
      </View>

      {/* Language */}
      <Text style={styles.label}>{t('profile.language')}</Text>
      <LanguageSwitcher variant="inline" />

      {/* Editable fields */}
      <Text style={styles.label}>{t('profile.name')}</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>{t('profile.bio')}</Text>
      <TextInput
        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
        value={bio}
        onChangeText={setBio}
        multiline
        placeholder={t('profile.bioPlaceholder')}
        placeholderTextColor="#999"
      />

      <Text style={styles.label}>{t('profile.gamingFrequency')}</Text>
      <View style={styles.chipRow}>
        {FREQ_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, frequency === opt.value && styles.chipActive]}
            onPress={() => setFrequency(opt.value)}
          >
            <Text style={[styles.chipText, frequency === opt.value && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t('profile.maxTravel')}</Text>
      <View style={styles.chipRow}>
        {TRAVEL_OPTIONS.map((km) => (
          <TouchableOpacity
            key={km}
            style={[styles.chip, maxTravelKm === km && styles.chipActive]}
            onPress={() => setMaxTravelKm(km)}
          >
            <Text style={[styles.chipText, maxTravelKm === km && styles.chipTextActive]}>
              {km} km
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, updateProfile.isPending && styles.btnDisabled]}
        onPress={handleSave}
        disabled={updateProfile.isPending}
      >
        {updateProfile.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>{t('profile.saveProfile')}</Text>
        )}
      </TouchableOpacity>

      {/* Game Library */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('profile.myGames', { count: games?.length ?? 0 })}</Text>
        <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
          <Text style={styles.addLink}>{showSearch ? t('profile.cancelAdd') : t('profile.addGame')}</Text>
        </TouchableOpacity>
      </View>

      {showSearch && (
        <View style={styles.searchBox}>
          <View style={styles.searchRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('profile.searchBggPlaceholder')}
              placeholderTextColor="#999"
              onSubmitEditing={() => setActiveSearch(searchQuery)}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.searchBtn} onPress={() => setActiveSearch(searchQuery)}>
              <Text style={styles.searchBtnText}>{t('auth.onboarding.games.go')}</Text>
            </TouchableOpacity>
          </View>
          {searching && <ActivityIndicator style={{ marginTop: 8 }} />}
          {searchResults?.map((g) => (
            <TouchableOpacity key={g.bggId} style={styles.searchResult} onPress={() => handleAddGame(g.bggId)}>
              {g.thumbnail && <Image source={{ uri: g.thumbnail }} style={styles.gameThumb} />}
              <Text style={styles.searchResultText} numberOfLines={1}>{g.title}</Text>
              <Text style={styles.addIcon}>+</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {gamesLoading ? (
        <ActivityIndicator style={{ marginTop: 12 }} />
      ) : (
        games?.map((item: any) => (
          <View key={item.bggId} style={styles.gameRow}>
            {item.game?.thumbnail && (
              <Image source={{ uri: item.game.thumbnail }} style={styles.gameThumb} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.gameTitle}>{item.game?.title ?? `Game #${item.bggId}`}</Text>
              <Text style={styles.gameOwnership}>{item.ownership}</Text>
            </View>
            <TouchableOpacity onPress={() => removeGame.mutate(item.bggId)}>
              <Text style={styles.removeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>{t('profile.logOut')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingTop: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 28 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  email: { fontSize: 14, color: '#9ca3af' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 15, color: '#000', marginBottom: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  chipActive: { borderColor: '#2563EB', backgroundColor: '#eff6ff' },
  chipText: { fontSize: 13, color: '#374151' },
  chipTextActive: { color: '#2563EB', fontWeight: '600' },
  saveBtn: { backgroundColor: '#2563EB', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20 },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  addLink: { color: '#2563EB', fontWeight: '600', fontSize: 14 },
  searchBox: { marginBottom: 12 },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchBtn: { backgroundColor: '#2563EB', borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '700' },
  searchResult: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  searchResultText: { flex: 1, fontSize: 14 },
  addIcon: { fontSize: 22, color: '#2563EB', fontWeight: '700' },
  gameRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  gameThumb: { width: 44, height: 44, borderRadius: 6 },
  gameTitle: { fontSize: 14, fontWeight: '600' },
  gameOwnership: { fontSize: 12, color: '#9ca3af' },
  removeBtn: { fontSize: 18, color: '#ef4444', padding: 4 },
  logoutBtn: { borderWidth: 1.5, borderColor: '#ef4444', borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 40, marginBottom: 40 },
  logoutText: { color: '#ef4444', fontWeight: '600' },
});
