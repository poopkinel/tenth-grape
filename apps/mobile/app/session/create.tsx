import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useCreateSession } from '@/hooks/use-sessions';

export default function CreateSessionScreen() {
  const router = useRouter();
  const create = useCreateSession();
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [locationText, setLocationText] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('4');
  const [description, setDescription] = useState('');

  async function submit() {
    if (!title || !scheduledAt || !locationText) {
      Alert.alert('Error', 'Title, date, and location are required.');
      return;
    }
    const parsed = new Date(scheduledAt);
    if (isNaN(parsed.getTime())) {
      Alert.alert('Error', 'Date format e.g. 2026-04-20 19:00');
      return;
    }
    try {
      await create.mutateAsync({
        title,
        scheduledAt: parsed.toISOString(),
        locationText,
        lat: 0,
        lng: 0,
        maxPlayers: parseInt(maxPlayers, 10) || 4,
        description: description || undefined,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not create session');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Catan night" placeholderTextColor="#999" />

      <Text style={styles.label}>Date & time</Text>
      <TextInput style={styles.input} value={scheduledAt} onChangeText={setScheduledAt} placeholder="2026-04-20 19:00" placeholderTextColor="#999" />

      <Text style={styles.label}>Location</Text>
      <TextInput style={styles.input} value={locationText} onChangeText={setLocationText} placeholder="e.g. Board game cafe" placeholderTextColor="#999" />

      <Text style={styles.label}>Max players</Text>
      <TextInput style={styles.input} value={maxPlayers} onChangeText={setMaxPlayers} keyboardType="number-pad" />

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} multiline />

      <TouchableOpacity style={[styles.submitBtn, create.isPending && { opacity: 0.6 }]} onPress={submit} disabled={create.isPending}>
        {create.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Create</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 15, color: '#000' },
  submitBtn: { backgroundColor: '#2563EB', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 24 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
