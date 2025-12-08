import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { useRouter } from "expo-router";

export interface Profile {
  full_name: string;
  role: string;
  is_active: boolean;
  subscription_expires: string | null;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadProfile = useCallback(async () => {
    setLoading(true);

    const {
      data: { session },
    }: { data: { session: Session | null } } = await supabase.auth.getSession();

    if (!session) {
      router.replace("/loginScreen");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (!error && data) {
      // ✅ SOLO mostrar los datos, NO redirigir nunca
      setProfile(data as Profile);
    } else {
      console.error("Error cargando perfil:", error);
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert("Error", "No se pudo cerrar sesión");
      return;
    }

    router.replace("/loginScreen");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingTop: insets.top,
        }}
      >
        <Text>No se encontró el perfil</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top + 20,
        paddingHorizontal: 16,
        backgroundColor: "#f5f5f5",
        justifyContent: "space-between",
      }}
    >
      <View style={{ alignItems: "center" }}>
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 20,
            backgroundColor: "#4f6cff",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 20,
            elevation: 5,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 36, fontWeight: "bold" }}>
            {getInitials(profile.full_name)}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: "#fff",
            width: "100%",
            borderRadius: 12,
            padding: 20,
            elevation: 3,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 12 }}>
            {profile.full_name}
          </Text>

          <Text style={{ fontSize: 16, color: "#555", marginBottom: 8 }}>
            🔹 Rol: {profile.role}
          </Text>

          <Text style={{ fontSize: 16, color: "#555", marginBottom: 8 }}>
            🔹 Estado: {profile.is_active ? "Activo" : "Inactivo"}
          </Text>

          {profile.subscription_expires && (
            <Text style={{ fontSize: 16, color: "#555" }}>
              🔹 Suscripción expira:{" "}
              {new Date(profile.subscription_expires).toLocaleDateString(
                "es-EC",
                {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }
              )}
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: "#ff4d4d",
          padding: 16,
          borderRadius: 12,
          alignItems: "center",
          marginBottom: 20,
          elevation: 3,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
        }}
        onPress={handleSignOut}
      >
        <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
          Cerrar sesión
        </Text>
      </TouchableOpacity>
    </View>
  );
}
