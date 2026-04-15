import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import { authedApi } from '@/lib/api';

export default function LocationStep() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleGetLocation() {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('auth.onboarding.location.permissionNeeded'),
          t('auth.onboarding.location.permissionMessage'),
        );
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await authedApi.patch('/users/me/location', {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      });

      router.push('/(auth)/onboarding/preferences');
    } catch {
      Alert.alert(t('common.error'), t('auth.onboarding.location.couldNotGet'));
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    router.push('/(auth)/onboarding/preferences');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📍</Text>
      <Text style={styles.title}>{t('auth.onboarding.location.title')}</Text>
      <Text style={styles.subtitle}>{t('auth.onboarding.location.subtitle')}</Text>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleGetLocation}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{t('auth.onboarding.location.useLocation')}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>{t('common.skip')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 64, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '100%',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipButton: { marginTop: 16, padding: 12 },
  skipText: { color: '#9ca3af', fontSize: 14 },
});
