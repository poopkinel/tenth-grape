import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEvent, useRsvpEvent, useCancelEvent } from '@/hooks/use-events';
import { EventAttendeeStatus } from '@meeple/shared';
import { useAuthStore } from '@/store/auth.store';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: event, isLoading } = useEvent(id);
  const rsvp = useRsvpEvent();
  const cancel = useCancelEvent();
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const myId = accessToken ? JSON.parse(atob(accessToken.split('.')[1])).sub : null;

  if (isLoading || !event) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  const isHost = event.host?.id === myId;

  function handleRsvp(status: EventAttendeeStatus) {
    rsvp.mutate({ id, status });
  }

  function handleCancel() {
    Alert.alert('Cancel event?', 'This removes the event for all attendees.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel event',
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
      <Text style={styles.title}>{event.title}</Text>

      <View style={styles.infoRow}>
        <Text style={styles.label}>When</Text>
        <Text style={styles.value}>
          {new Date(event.startAt).toLocaleString()}
          {event.endAt ? ` – ${new Date(event.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Where</Text>
        <Text style={styles.value}>{event.locationText}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Going</Text>
        <Text style={styles.value}>
          {event.attendeeCount}{event.capacity ? ` / ${event.capacity}` : ''}
        </Text>
      </View>

      {event.host && (
        <View style={styles.infoRow}>
          <Text style={styles.label}>Host</Text>
          <Text style={styles.value}>{event.host.name}</Text>
        </View>
      )}

      {event.description && (
        <View style={styles.descBlock}>
          <Text style={styles.label}>About</Text>
          <Text style={styles.descText}>{event.description}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Attendees</Text>
      {event.attendees.map((a) => (
        <View key={a.userId} style={styles.attendeeRow}>
          <View style={styles.pAvatar}>
            <Text style={styles.pAvatarText}>
              {a.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.pName}>{a.name}</Text>
          <View style={[styles.statusBadge, statusColor(a.status)]}>
            <Text style={styles.statusText}>{a.status}</Text>
          </View>
        </View>
      ))}

      {/* RSVP */}
      {!isHost && (
        <View style={styles.rsvpRow}>
          <TouchableOpacity
            style={[styles.rsvpBtn, styles.goingBtn, event.myStatus === 'GOING' && styles.btnSelected]}
            onPress={() => handleRsvp(EventAttendeeStatus.GOING)}
          >
            <Text style={styles.goingBtnText}>Going</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rsvpBtn, styles.interestedBtn, event.myStatus === 'INTERESTED' && styles.btnSelected]}
            onPress={() => handleRsvp(EventAttendeeStatus.INTERESTED)}
          >
            <Text style={styles.interestedBtnText}>Interested</Text>
          </TouchableOpacity>
        </View>
      )}

      {isHost && (
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.cancelBtnText}>Cancel event</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function statusColor(status: string) {
  if (status === 'GOING' || status === 'ATTENDED') return { backgroundColor: '#dcfce7' };
  if (status === 'INTERESTED') return { backgroundColor: '#fef3c7' };
  return { backgroundColor: '#f3f4f6' };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  label: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  value: { fontSize: 14, color: '#111', fontWeight: '500', flexShrink: 1, textAlign: 'right' },
  descBlock: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  descText: { fontSize: 14, color: '#374151', marginTop: 6, lineHeight: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 24, marginBottom: 12 },
  attendeeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  pAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  pAvatarText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  pName: { flex: 1, fontSize: 14, fontWeight: '600' },
  statusBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700', color: '#111' },

  rsvpRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  rsvpBtn: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  goingBtn: { backgroundColor: '#16a34a' },
  goingBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  interestedBtn: { borderWidth: 1.5, borderColor: '#f59e0b' },
  interestedBtnText: { color: '#f59e0b', fontWeight: '700', fontSize: 15 },
  btnSelected: { opacity: 0.6 },

  cancelBtn: { borderWidth: 1.5, borderColor: '#ef4444', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 32 },
  cancelBtnText: { color: '#ef4444', fontWeight: '600' },
});
