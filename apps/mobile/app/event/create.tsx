import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useCreateEvent } from '@/hooks/use-events';

export default function CreateEventScreen() {
  const router = useRouter();
  const create = useCreateEvent();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationText, setLocationText] = useState('');
  const [startAt, setStartAt] = useState('');
  const [capacity, setCapacity] = useState('');

  async function submit() {
    if (!title || !startAt || !locationText) {
      Alert.alert('Error', 'Title, start time, and location are required.');
      return;
    }
    const parsed = new Date(startAt);
    if (isNaN(parsed.getTime())) {
      Alert.alert('Error', 'Date format e.g. 2026-04-20 19:00');
      return;
    }

    // Try to get the user's location for lat/lng. Fall back to 0,0.
    let lat = 0, lng = 0;
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === 'granted') {
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      } catch {}
    }

    try {
      await create.mutateAsync({
        title,
        description: description || undefined,
        locationText,
        lat,
        lng,
        startAt: parsed.toISOString(),
        capacity: capacity ? parseInt(capacity, 10) : undefined,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not create event');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Spring game convention" placeholderTextColor="#999" />

      <Text style={styles.label}>Date & time</Text>
      <TextInput style={styles.input} value={startAt} onChangeText={setStartAt} placeholder="2026-05-01 14:00" placeholderTextColor="#999" />

      <Text style={styles.label}>Location</Text>
      <TextInput style={styles.input} value={locationText} onChangeText={setLocationText} placeholder="e.g. Community center" placeholderTextColor="#999" />

      <Text style={styles.label}>Capacity (optional)</Text>
      <TextInput style={styles.input} value={capacity} onChangeText={setCapacity} keyboardType="number-pad" placeholder="Leave blank for unlimited" placeholderTextColor="#999" />

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} multiline />

      <TouchableOpacity style={[styles.submitBtn, create.isPending && { opacity: 0.6 }]} onPress={submit} disabled={create.isPending}>
        {create.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Create event</Text>}
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
