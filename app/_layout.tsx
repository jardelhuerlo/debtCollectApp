import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [sessionLoaded, setSessionLoaded] = useState(false);

  useEffect(() => {
    async function setupSession() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        await supabase.auth.signInWithPassword({
          email: "dev@local.com",
          password: "12345678",
        });
      }

      setSessionLoaded(true);
    }

    // --- escuchar cambios de autenticación ---
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSessionLoaded(true);
      }
    );

    setupSession();

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!sessionLoaded) return null; // evita que cargue rutas sin sesión

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
