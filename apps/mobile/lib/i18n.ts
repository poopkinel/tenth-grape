import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { I18nManager, Platform } from 'react-native';
import { secureStorage } from './secure-storage';
import en from '../locales/en.json';
import he from '../locales/he.json';

export const SUPPORTED_LANGUAGES = ['en', 'he'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  he: 'עברית',
};

/** Languages with right-to-left scripts. */
const RTL_LANGUAGES: SupportedLanguage[] = ['he'];

const STORAGE_KEY = 'language';

function detectInitialLanguage(): SupportedLanguage {
  try {
    const deviceLang = getLocales()?.[0]?.languageCode;
    if (deviceLang && (SUPPORTED_LANGUAGES as readonly string[]).includes(deviceLang)) {
      return deviceLang as SupportedLanguage;
    }
  } catch {
    // expo-localization can fail in some environments; fall through
  }
  return 'en';
}

function applyDirection(language: SupportedLanguage) {
  const isRTL = RTL_LANGUAGES.includes(language);

  if (Platform.OS === 'web') {
    // Browsers respect the <html dir="..."> attribute for layout direction.
    if (typeof document !== 'undefined') {
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
    return;
  }

  // Native: I18nManager.forceRTL only fully applies after an app restart.
  // We still set it so the flag is correct in memory for components that read it.
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
  }
}

/**
 * Initialize i18next. Reads the saved language preference (if any), falls
 * back to device locale, defaults to English. Safe to call before rendering.
 */
export async function initI18n(): Promise<SupportedLanguage> {
  const saved = await secureStorage.get(STORAGE_KEY);
  const initialLang =
    saved && (SUPPORTED_LANGUAGES as readonly string[]).includes(saved)
      ? (saved as SupportedLanguage)
      : detectInitialLanguage();

  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      resources: {
        en: { translation: en },
        he: { translation: he },
      },
      lng: initialLang,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      compatibilityJSON: 'v4',
    });
  } else {
    await i18n.changeLanguage(initialLang);
  }

  applyDirection(initialLang);
  return initialLang;
}

/** Switch language at runtime and persist the choice. */
export async function setLanguage(language: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(language);
  await secureStorage.set(STORAGE_KEY, language);
  applyDirection(language);
}

export function getCurrentLanguage(): SupportedLanguage {
  return (i18n.language as SupportedLanguage) || 'en';
}

export { i18n };
