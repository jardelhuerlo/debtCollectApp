import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Linking from "expo-linking";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AppProvider } from "@/components/AppProvider";
import { getCurrentSession, onAuthStateChange } from "@/services/auth.service";
import { validateDeepLink } from "@/lib/deepLink";
import { logger } from "@/lib/logger";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import type { Session } from "@supabase/supabase-js";

function PushRegistration() {
  usePushNotifications();
  return null;
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentSession().then((s) => {
      setSession(s);
      setLoading(false);
    });

    const { unsubscribe } = onAuthStateChange((s) => {
      setSession(s);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleDeepLink = ({ url }: { url: string }) => {
      if (url.startsWith("exp") || url.includes("expo-development-client")) {
        return;
      }
      const result = validateDeepLink(url);
      if (!result.valid) {
        logger.warn("Invalid deep link blocked", { url });
        return;
      }
      logger.info("Deep link handled", { type: result.type });
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    const subscription = Linking.addEventListener("url", handleDeepLink);
    return () => subscription.remove();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          {session && <PushRegistration />}
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
              animationDuration: 250,
            }}
          />
        </AppProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
