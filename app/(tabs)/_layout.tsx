import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialRoute = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setInitialRoute('userScreen');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_active, subscription_expires')
        .eq('id', session.user.id)
        .single();

      if (!profile) {
        setInitialRoute('userScreen');
        return;
      }

      const now = new Date();
      const expiresAt = profile.subscription_expires
        ? new Date(profile.subscription_expires)
        : null;

      const isExpired =
        !profile.is_active ||
        (expiresAt ? expiresAt <= now : true);

      if (isExpired) {
        // 🔴 Si está vencida → manda al perfil
        setInitialRoute('userScreen');
      } else {
        // 🟢 Si está activa → manda a préstamos
        setInitialRoute('loans-historyScreen');
      }
    };

    loadInitialRoute();
  }, []);

  // MIENTRAS CARGA, NO RENDERIZAR NAV
  if (!initialRoute) return null;

  return (
    <Tabs
      initialRouteName={initialRoute}
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="loans-historyScreen"
        options={{
          title: 'Préstamo',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="banknote.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="loansScreen"
        options={{
          title: 'Registro',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="plus.circle.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="userScreen"
        options={{
          title: 'Usuario',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
