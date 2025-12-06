import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments() as string[];
  const router = useRouter();

  useEffect(() => {
    // Obtener la sesión inicial
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // Escuchar cambios
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const inTabsGroup = segments[0] === "(tabs)";
    const inPublicRoute =
      segments[0] === "loginScreen" || segments[0] === "signUpScreen";

    if (session) {
      // If user is authenticated and on login/signup OR on root (empty segments), redirect to home
      if (inPublicRoute || segments.length === 0) {
        router.replace("/(tabs)/loans-historyScreen");
      }
    } else {
      // If user is not authenticated and NOT on login/signup, redirect to login
      if (!inPublicRoute) {
        router.replace("/loginScreen");
      }
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
