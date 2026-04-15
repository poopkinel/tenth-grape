import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSession, useRsvp, useCancelSession, useCompleteSession } from '@/hooks/use-sessions';
import { useAuthStore } from '@/store/auth.store';

const STATUS_COLORS: Record<string, string> = {
  ACCEPTED: '#16a34a',
  INVITED: '#f59e0b',
  DECLINED: '#9ca3af',
};

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: session, isLoading } = useSession(id);
  const rsvp = useRsvp();
  const cancel = useCancelSession();
  const complete = useCompleteSession();
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const myId = accessToken ? JSON.parse(atob(accessToken.split('.')[1])).sub : null;

  const [completeNotes, setCompleteNotes] = useState('');
  const [showComplete, setShowComplete] = useState(false);

  if (isLoading || !session) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  const isHost = session.hostId === myId;
  const myParticipant = session.participants?.find((p: any) => p.userId === myId);
  const date = new Date(session.scheduledAt);
  const accepted = session.participants?.filter((p: any) => p.status === 'ACCEPTED').length ?? 0;
  const isCompleted = session.status === 'COMPLETED';

  function handleRsvp(status: string) {
    rsvp.mutate({ id, status });
  }

  function handleCancel() {
    Alert.alert('Cancel session?', 'This removes the session for all participants.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel session',
        style: 'destructive',
        onPress: async () => {
          await cancel.mutateAsync(id);
          router.back();
        },
      },
    ]);
  }

  async function handleComplete() {
    try {
      await complete.mutateAsync({
        id,
        notes: completeNotes.trim() || undefined,
      });
      Alert.alert('Done!', 'Session marked complete and posted to your feed.');
      setShowComplete(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not complete session');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{session.title}</Text>
        <View style={[styles.statusPill, isCompleted ? styles.completedPill : styles.plannedPill]}>
          <Text style={[styles.statusPillText, isCompleted ? styles.completedText : styles.plannedText]}>
            {session.status}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Date</Text>
        <Text style={styles.infoValue}>
          {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Location</Text>
        <Text style={styles.infoValue}>{session.locationText}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Players</Text>
        <Text style={styles.infoValue}>{accepted} / {session.maxPlayers}</Text>
      </View>

      {session.games?.length > 0 && (
        <View style={styles.gamesBlock}>
          <Text style={styles.infoLabel}>Games</Text>
          {session.games.map((sg: any) => (
            <View key={sg.bggId} style={styles.gameRow}>
              {sg.game?.thumbnail && (
                <Image source={{ uri: sg.game.thumbnail }} style={styles.gameThumb} />
              )}
              <Text style={styles.gameTitle}>{sg.game?.title ?? `Game #${sg.bggId}`}</Text>
            </View>
          ))}
        </View>
      )}

      {session.description && (
        <View style={styles.descBlock}>
          <Text style={styles.infoLabel}>Description</Text>
          <Text style={styles.descText}>{session.description}</Text>
        </View>
      )}

      {isCompleted && session.notes && (
        <View style={styles.descBlock}>
          <Text style={styles.infoLabel}>Notes</Text>
          <Text style={styles.descText}>{session.notes}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Participants</Text>
      {session.participants?.map((p: any) => (
        <View key={p.userId} style={styles.participantRow}>
          <View style={styles.pAvatar}>
            <Text style={styles.pAvatarText}>
              {p.user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.pName}>{p.user.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[p.status] ?? '#9ca3af') + '20' }]}>
            <Text style={[styles.statusText, { color: STATUS_COLORS[p.status] ?? '#9ca3af' }]}>
              {p.status}
            </Text>
          </View>
        </View>
      ))}

      {!isCompleted && !isHost && myParticipant && myParticipant.status === 'INVITED' && (
        <View style={styles.rsvpRow}>
          <TouchableOpacity style={styles.acceptBtn} onPress={() => handleRsvp('ACCEPTED')} disabled={rsvp.isPending}>
            <Text style={styles.acceptBtnText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.declineBtn} onPress={() => handleRsvp('DECLINED')} disabled={rsvp.isPending}>
            <Text style={styles.declineBtnText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isCompleted && isHost && (
        <>
          {showComplete ? (
            <View style={styles.completeForm}>
              <Text style={styles.infoLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.notesInput, { height: 80, textAlignVertical: 'top' }]}
                value={completeNotes}
                onChangeText={setCompleteNotes}
                multiline
                placeholder="How did it go?"
                placeholderTextColor="#999"
              />
              <View style={styles.rsvpRow}>
                <TouchableOpacity style={styles.acceptBtn} onPress={handleComplete} disabled={complete.isPending}>
                  {complete.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.acceptBtnText}>Mark complete & post</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.declineBtn} onPress={() => setShowComplete(false)}>
                  <Text style={styles.declineBtnText}>Back</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.completeBtn} onPress={() => setShowComplete(true)}>
              <Text style={styles.completeBtnText}>Mark as played</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelBtnText}>Cancel session</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingTop: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', flex: 1 },
  statusPill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  plannedPill: { backgroundColor: '#eff6ff' },
  completedPill: { backgroundColor: '#dcfce7' },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  plannedText: { color: '#2563EB' },
  completedText: { color: '#16a34a' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  infoLabel: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  infoValue: { fontSize: 14, color: '#111', fontWeight: '500' },
  gamesBlock: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  gameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  gameThumb: { width: 36, height: 36, borderRadius: 6 },
  gameTitle: { fontSize: 14, fontWeight: '600' },
  descBlock: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  descText: { fontSize: 14, color: '#374151', marginTop: 4, lineHeight: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 24, marginBottom: 12 },
  participantRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  pAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  pAvatarText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  pName: { flex: 1, fontSize: 14, fontWeight: '600' },
  statusBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  rsvpRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  acceptBtn: { flex: 1, backgroundColor: '#16a34a', borderRadius: 12, padding: 14, alignItems: 'center' },
  acceptBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  declineBtn: { flex: 1, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, alignItems: 'center' },
  declineBtnText: { color: '#6b7280', fontWeight: '700', fontSize: 15 },
  completeBtn: { backgroundColor: '#16a34a', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 24 },
  completeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  completeForm: { marginTop: 24 },
  notesInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 15, color: '#000', marginTop: 6 },
  cancelBtn: { borderWidth: 1.5, borderColor: '#ef4444', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 },
  cancelBtnText: { color: '#ef4444', fontWeight: '600' },
});
