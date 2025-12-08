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

    const firstSegment = segments[0];

    const isAuthScreen =
      firstSegment === "loginScreen" ||
      firstSegment === "signUpScreen";

    const isUserScreen =
      firstSegment === "(tabs)" &&
      segments[1] === "userScreen";

    const isLoansScreen =
      firstSegment === "(tabs)" &&
      (segments[1] === "loans-historyScreen" ||
        segments[1] === "loansScreen");

    const checkAccess = async () => {
      if (!session) {
        if (!isAuthScreen) router.replace("/loginScreen");
        return;
      }

      // Consultar estado de suscripción
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_active, subscription_expires")
        .eq("id", session.user.id)
        .single();

      if (!profile) return;

      const now = new Date();
      const expiresAt = profile.subscription_expires
        ? new Date(profile.subscription_expires)
        : null;

      const isExpired =
        !profile.is_active ||
        (expiresAt ? expiresAt <= now : true);

      // ✅ BLOQUEO SOLO PARA LOANS
      if (isExpired && isLoansScreen) {
        router.replace("/subscriptionExpiredScreen");
        return;
      }

    };

    checkAccess();
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
