import { View, Text, StyleSheet } from 'react-native';

// Phase 5: Game night scheduling
export default function SessionsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sessions</Text>
      <Text style={styles.subtitle}>Upcoming game nights will appear here — coming in Phase 5</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#666', textAlign: 'center' },
});
