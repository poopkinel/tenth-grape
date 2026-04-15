import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { setLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/lib/i18n';

const SHORT_LABEL: Record<SupportedLanguage, string> = {
  en: 'EN',
  he: 'עב',
};

/**
 * Small segmented toggle for switching languages. Defaults to a floating
 * position in the top-right (good for auth screens). Pass `variant="inline"`
 * to render in normal flow (good for settings rows).
 */
export function LanguageSwitcher({ variant = 'floating' }: { variant?: 'floating' | 'inline' }) {
  const { i18n } = useTranslation();
  const current = i18n.language as SupportedLanguage;

  return (
    <View style={[styles.container, variant === 'floating' && styles.floating]}>
      {SUPPORTED_LANGUAGES.map((lang) => {
        const active = current === lang;
        return (
          <TouchableOpacity
            key={lang}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => setLanguage(lang)}
            accessibilityLabel={`Switch to ${lang}`}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>
              {SHORT_LABEL[lang]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    padding: 3,
  },
  floating: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 10,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  pillActive: { backgroundColor: '#fff' },
  pillText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  pillTextActive: { color: '#2563EB' },
});
