import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/auth.store';
import { queryClient } from '@/lib/query-client';
import { initI18n } from '@/lib/i18n';

function AuthGate() {
  const { accessToken, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!accessToken && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (accessToken && inAuthGroup) {
      router.replace('/(tabs)/feed');
    }
  }, [accessToken, isLoading, segments]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const hydrate = useAuthStore((s) => s.hydrate);
  const [i18nReady, setI18nReady] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    (async () => {
      await initI18n();
      setI18nReady(true);
    })();
    hydrate();
  }, []);

  if (!i18nReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthGate />
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="chat/[conversationId]" options={{ title: t('tabs.messages') }} />
          <Stack.Screen name="post/[id]" options={{ title: t('feed.postType.TEXT') }} />
          <Stack.Screen name="event/[id]" options={{ title: t('tabs.events') }} />
          <Stack.Screen name="event/create" options={{ title: t('tabs.events') }} />
          <Stack.Screen name="group/[id]" options={{ title: 'Group' }} />
          <Stack.Screen name="session/[id]" options={{ title: t('tabs.play') }} />
          <Stack.Screen name="session/create" options={{ title: t('tabs.play') }} />
          <Stack.Screen name="log-play" options={{ title: t('tabs.play') }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
