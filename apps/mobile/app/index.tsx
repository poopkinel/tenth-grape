import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';

export default function Index() {
  const { accessToken, isLoading } = useAuthStore();

  // Still hydrating auth from SecureStore — don't decide yet.
  if (isLoading) return null;

  return accessToken
    ? <Redirect href="/(tabs)/feed" />
    : <Redirect href="/(auth)/login" />;
}
