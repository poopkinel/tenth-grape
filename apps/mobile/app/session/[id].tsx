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
import { useSession, useRsvp, useCancelSession } from '@/hooks/use-sessions';
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
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const myId = accessToken ? JSON.parse(atob(accessToken.split('.')[1])).sub : null;

  if (isLoading || !session) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  const isHost = session.hostId === myId;
  const myParticipant = session.participants?.find((p: any) => p.userId === myId);
  const date = new Date(session.scheduledAt);
  const accepted = session.participants?.filter((p: any) => p.status === 'ACCEPTED').length ?? 0;

  function handleRsvp(status: string) {
    rsvp.mutate({ id, status });
  }

  function handleCancel() {
    Alert.alert('Cancel session', 'This will remove the session for all participants.', [
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{session.title}</Text>

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

      {session.game && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Game</Text>
          <Text style={styles.infoValue}>{session.game.title}</Text>
        </View>
      )}

      {session.description && (
        <View style={styles.descBlock}>
          <Text style={styles.infoLabel}>Description</Text>
          <Text style={styles.descText}>{session.description}</Text>
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

      {/* RSVP buttons — shown if not host and invited */}
      {!isHost && myParticipant && myParticipant.status === 'INVITED' && (
        <View style={styles.rsvpRow}>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => handleRsvp('ACCEPTED')}
            disabled={rsvp.isPending}
          >
            <Text style={styles.acceptBtnText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.declineBtn}
            onPress={() => handleRsvp('DECLINED')}
            disabled={rsvp.isPending}
          >
            <Text style={styles.declineBtnText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}

      {isHost && (
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.cancelBtnText}>Cancel session</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingTop: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  infoLabel: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  infoValue: { fontSize: 14, color: '#111', fontWeight: '500' },
  descBlock: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  descText: { fontSize: 14, color: '#374151', marginTop: 4, lineHeight: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 24, marginBottom: 12 },
  participantRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  pAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  pAvatarText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  pName: { flex: 1, fontSize: 14, fontWeight: '600' },
  statusBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  rsvpRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  acceptBtn: { flex: 1, backgroundColor: '#16a34a', borderRadius: 12, padding: 14, alignItems: 'center' },
  acceptBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  declineBtn: { flex: 1, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, alignItems: 'center' },
  declineBtnText: { color: '#6b7280', fontWeight: '700', fontSize: 15 },
  cancelBtn: { borderWidth: 1.5, borderColor: '#ef4444', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 32 },
  cancelBtnText: { color: '#ef4444', fontWeight: '600' },
});
