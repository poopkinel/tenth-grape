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
  Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { LanguageSwitcher } from '@/components/language-switcher';
import { APP_NAME, type AuthTokensDto } from '@meeple/shared';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setTokens } = useAuthStore();
  const router = useRouter();

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true);
    try {
      const tokens = await api.post<AuthTokensDto>('/auth/login', { email, password });
      await setTokens(tokens);
      router.replace('/(tabs)/feed');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('auth.login.failed');
      Alert.alert(t('common.error'), message);
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
      <View style={styles.inner}>
        <Text style={styles.title}>{APP_NAME}</Text>
        <Text style={styles.subtitle}>{t('auth.login.title')}</Text>

        <TextInput
          style={styles.input}
          placeholder={t('auth.login.emailPlaceholder')}
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          placeholder={t('auth.login.passwordPlaceholder')}
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('auth.login.submit')}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.login.noAccount')}</Text>
          <Link href="/(auth)/register">
            <Text style={styles.link}>{t('auth.login.signUp')}</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 40, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
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
