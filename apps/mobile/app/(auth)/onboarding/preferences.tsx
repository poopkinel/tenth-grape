import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { authedApi } from '@/lib/api';
import { GamingFrequency } from '@meeple/shared';

const TRAVEL_OPTIONS = [5, 10, 25, 50, 100];

export default function PreferencesStep() {
  const { t } = useTranslation();
  const [frequency, setFrequency] = useState<GamingFrequency>(GamingFrequency.REGULAR);
  const [maxTravelKm, setMaxTravelKm] = useState(25);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const FREQUENCY_OPTIONS = [
    {
      value: GamingFrequency.CASUAL,
      label: t('auth.onboarding.preferences.frequencyCasual'),
      description: t('auth.onboarding.preferences.frequencyCasualDesc'),
    },
    {
      value: GamingFrequency.REGULAR,
      label: t('auth.onboarding.preferences.frequencyRegular'),
      description: t('auth.onboarding.preferences.frequencyRegularDesc'),
    },
    {
      value: GamingFrequency.HEAVY,
      label: t('auth.onboarding.preferences.frequencyHeavy'),
      description: t('auth.onboarding.preferences.frequencyHeavyDesc'),
    },
  ];

  async function handleNext() {
    setLoading(true);
    try {
      await authedApi.patch('/users/me', { gamingFrequency: frequency, maxTravelKm });
      router.push('/(auth)/onboarding/games');
    } catch {
      Alert.alert(t('common.error'), t('auth.onboarding.preferences.savePrefsFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('auth.onboarding.preferences.title')}</Text>

      <Text style={styles.sectionLabel}>{t('auth.onboarding.preferences.frequencyQuestion')}</Text>
      <View style={styles.optionGroup}>
        {FREQUENCY_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.option, frequency === opt.value && styles.optionSelected]}
            onPress={() => setFrequency(opt.value)}
          >
            <Text style={[styles.optionLabel, frequency === opt.value && styles.optionLabelSelected]}>
              {opt.label}
            </Text>
            <Text style={[styles.optionDesc, frequency === opt.value && styles.optionDescSelected]}>
              {opt.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>{t('auth.onboarding.preferences.travelQuestion')}</Text>
      <View style={styles.travelRow}>
        {TRAVEL_OPTIONS.map((km) => (
          <TouchableOpacity
            key={km}
            style={[styles.travelChip, maxTravelKm === km && styles.travelChipSelected]}
            onPress={() => setMaxTravelKm(km)}
          >
            <Text style={[styles.travelText, maxTravelKm === km && styles.travelTextSelected]}>
              {km} km
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('common.next')}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 32 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 32 },
  sectionLabel: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 12 },
  optionGroup: { gap: 10, marginBottom: 32 },
  option: {
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
  },
  optionSelected: { borderColor: '#2563EB', backgroundColor: '#eff6ff' },
  optionLabel: { fontSize: 16, fontWeight: '700', color: '#374151' },
  optionLabelSelected: { color: '#2563EB' },
  optionDesc: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  optionDescSelected: { color: '#6b96e8' },
  travelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 40 },
  travelChip: {
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  travelChipSelected: { borderColor: '#2563EB', backgroundColor: '#eff6ff' },
  travelText: { fontSize: 14, color: '#374151' },
  travelTextSelected: { color: '#2563EB', fontWeight: '600' },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
