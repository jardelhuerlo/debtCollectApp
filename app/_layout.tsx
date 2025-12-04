import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {

  useEffect(() => {
    async function loginDev() {
      // Verifica si ya hay usuario autenticado
      const { data } = await supabase.auth.getUser();
      if (data?.user) return;

      // Login automático
      await supabase.auth.signInWithPassword({
        email: "dev@local.com",
        password: "12345678",
      });
    }

    loginDev();
  }, []);


  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
