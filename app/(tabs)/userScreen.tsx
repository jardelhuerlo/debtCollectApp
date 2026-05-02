import { useCallback } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/hooks/useAuth";
import { useProfileQuery } from "@/hooks/useQueryProfile";
import { Colors, Styles, Spacing } from "@/constants/styles";
import { showError } from "@/lib/toast";
import type { Profile } from "@/types";
import { ProfileSkeleton } from "@/components/SkeletonLoader";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfileQuery();

  const handleSignOut = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { error } = await signOut();
    if (error) {
      showError("Error", "No se pudo cerrar sesión");
      return;
    }
    router.replace("/loginScreen");
  }, [signOut, router]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (authLoading || profileLoading) {
    return (
      <View style={[Styles.screenGray, { paddingTop: insets.top + Spacing.xxl }]}>
        <ProfileSkeleton />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[Styles.center, { paddingTop: insets.top }]}>
        <Text>No se encontró el perfil</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        Styles.screenGray,
        {
          paddingTop: insets.top + Spacing.xxl,
          paddingHorizontal: Spacing.lg,
          justifyContent: "space-between",
        },
      ]}
    >
      <View style={{ alignItems: "center" }}>
        <View style={Styles.avatar}>
          <Text style={Styles.avatarText}>{getInitials(profile.full_name)}</Text>
        </View>

        <View style={Styles.profileCard}>
          <Text style={Styles.profileName}>{profile.full_name}</Text>
          <Text style={Styles.profileRow}>🔹 Rol: {profile.role}</Text>
          <Text style={Styles.profileRow}>
            🔹 Estado: {profile.is_active ? "Activo" : "Inactivo"}
          </Text>
          {profile.subscription_expires && (
            <Text style={Styles.profileRow}>
              🔹 Suscripción expira:{" "}
              {new Date(profile.subscription_expires).toLocaleDateString("es-EC", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity style={Styles.btnDanger} onPress={handleSignOut} activeOpacity={0.7}>
        <Text style={Styles.btnDangerText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}
