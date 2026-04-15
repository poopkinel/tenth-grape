import { View, Text, StyleSheet } from 'react-native';
import { Slot, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';

const STEPS = [
  { path: 'location', labelKey: 'auth.onboarding.steps.location' },
  { path: 'preferences', labelKey: 'auth.onboarding.steps.preferences' },
  { path: 'games', labelKey: 'auth.onboarding.steps.games' },
];

export default function OnboardingLayout() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const currentStep = STEPS.findIndex((s) => pathname.includes(s.path));

  return (
    <View style={styles.container}>
      {/* Step indicator */}
      <View style={styles.stepRow}>
        {STEPS.map((step, i) => (
          <View key={step.path} style={styles.stepItem}>
            <View style={[styles.dot, i <= currentStep && styles.dotActive]}>
              <Text style={[styles.dotText, i <= currentStep && styles.dotTextActive]}>
                {i + 1}
              </Text>
            </View>
            <Text style={[styles.stepLabel, i === currentStep && styles.stepLabelActive]}>
              {t(step.labelKey)}
            </Text>
          </View>
        ))}
      </View>

      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stepItem: { alignItems: 'center', gap: 6 },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotActive: { backgroundColor: '#2563EB' },
  dotText: { fontSize: 14, fontWeight: '700', color: '#9ca3af' },
  dotTextActive: { color: '#fff' },
  stepLabel: { fontSize: 12, color: '#9ca3af' },
  stepLabelActive: { color: '#2563EB', fontWeight: '600' },
});
