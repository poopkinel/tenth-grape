import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGroup, useLeaveGroup } from '@/hooks/use-groups';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: group, isLoading } = useGroup(id);
  const leave = useLeaveGroup();
  const router = useRouter();

  if (isLoading || !group) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  function handleLeave() {
    Alert.alert('Leave group?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          await leave.mutateAsync(id);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{group.name}</Text>
      {group.description && <Text style={styles.description}>{group.description}</Text>}
      <Text style={styles.memberCount}>{group.memberCount} members</Text>

      <Text style={styles.sectionTitle}>Members</Text>
      {group.members.map((m) => (
        <View key={m.userId} style={styles.memberRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {m.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.memberName}>{m.name}</Text>
          {m.role === 'OWNER' && <Text style={styles.ownerBadge}>owner</Text>}
        </View>
      ))}

      {group.myRole && group.myRole !== 'OWNER' && (
        <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
          <Text style={styles.leaveBtnText}>Leave group</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 6 },
  description: { fontSize: 14, color: '#6b7280', lineHeight: 20, marginBottom: 8 },
  memberCount: { fontSize: 13, color: '#2563EB', fontWeight: '600', marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  memberName: { flex: 1, fontSize: 14, fontWeight: '600' },
  ownerBadge: { fontSize: 11, color: '#f59e0b', fontWeight: '700', textTransform: 'uppercase' },
  leaveBtn: { borderWidth: 1.5, borderColor: '#ef4444', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 32 },
  leaveBtnText: { color: '#ef4444', fontWeight: '600' },
});
