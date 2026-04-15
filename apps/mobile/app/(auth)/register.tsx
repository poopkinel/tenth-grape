import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { LanguageSwitcher } from '@/components/language-switcher';
import { showAlert } from '@/lib/alert';
import type { AuthTokensDto } from '@meeple/shared';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setTokens } = useAuthStore();
  const router = useRouter();

  async function handleRegister() {
    if (!name || !email || !password) {
      showAlert(t('common.error'), t('auth.register.validation.fillAllFields'));
      return;
    }
    if (password.length < 8) {
      showAlert(t('common.error'), t('auth.register.validation.passwordTooShort'));
      return;
    }
    setLoading(true);
    try {
      const tokens = await api.post<AuthTokensDto>('/auth/register', { name, email, password });
      await setTokens(tokens);
      router.replace('/(auth)/onboarding/location');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('auth.register.failed');
      showAlert(t('common.error'), message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LanguageSwitcher />
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('auth.register.title')}</Text>
        <Text style={styles.subtitle}>{t('auth.register.subtitle')}</Text>

        <TextInput
          style={styles.input}
          placeholder={t('auth.register.namePlaceholder')}
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
          autoComplete="name"
        />
        <TextInput
          style={styles.input}
          placeholder={t('auth.register.emailPlaceholder')}
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          placeholder={t('auth.register.passwordPlaceholder')}
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('auth.register.submit')}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.register.haveAccount')}</Text>
          <Link href="/(auth)/login">
            <Text style={styles.link}>{t('auth.register.logIn')}</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 40 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    color: '#000',
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#666', fontSize: 14 },
  link: { color: '#2563EB', fontSize: 14, fontWeight: '600' },
});
