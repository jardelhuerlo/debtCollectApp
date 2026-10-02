import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useProfileQuery } from "@/hooks/useQueryProfile";
import { Colors, Styles, Spacing, FontSize, Radius } from "@/constants/styles";
import { showError } from "@/lib/toast";
import type { Profile } from "@/types";
import { ProfileSkeleton } from "@/components/SkeletonLoader";
import { checkSubscription } from "@/services/profile.service";
import type { SubscriptionStatus } from "@/services/profile.service";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfileQuery();
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    const check = async () => {
      const user = await supabase.auth.getUser().then((r) => r.data.user);
      if (!user) return;
      const status = await checkSubscription(user.id);
      setSubStatus(status);
    };
    check();
  }, []);

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

  const isActive = subStatus?.isActive ?? false;
  const daysRemaining = subStatus?.daysRemaining ?? 0;
  const isExpiringSoon = subStatus?.isExpiringSoon ?? false;

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
            🔹 Estado:{" "}
            <Text style={{ color: isActive ? "#22c55e" : Colors.delete, fontWeight: "700" }}>
              {isActive ? "Activa" : "Expirada"}
            </Text>
          </Text>

          {isActive && daysRemaining > 0 && (
            <Text style={[Styles.profileRow, isExpiringSoon && { color: "#e65100" }]}>
              🔹 {isExpiringSoon ? "⚠️ Expira en" : "Expira en"} {daysRemaining}{" "}
              {daysRemaining === 1 ? "día" : "días"}
            </Text>
          )}

          {!isActive && (
            <Text style={[Styles.profileRow, { color: Colors.delete }]}>
              🔹 Tu suscripción ha expirado
            </Text>
          )}

          {profile.subscription_expires && (
            <Text style={Styles.profileRow}>
              🔹 Vence:{" "}
              {new Date(profile.subscription_expires).toLocaleDateString("es-EC", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </Text>
          )}
        </View>
      </View>

      <View>
        {profile.role === "admin" && (
          <TouchableOpacity
            style={s.adminBtn}
            onPress={() => router.push("/adminScreen")}
            activeOpacity={0.7}
          >
            <Text style={s.adminBtnText}>Panel de Administrador</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={Styles.btnDanger} onPress={handleSignOut} activeOpacity={0.7}>
          <Text style={Styles.btnDangerText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  adminBtn: {
    width: "100%",
    backgroundColor: "#1e293b",
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  adminBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: FontSize.lg,
  },
  renewBtn: {
    width: "100%",
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  renewBtnText: {
    color: Colors.surface,
    fontWeight: "bold",
    fontSize: FontSize.lg,
  },
  manageBtn: {
    width: "100%",
    backgroundColor: Colors.primaryBg,
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  manageBtnText: {
    color: Colors.primary,
    fontWeight: "bold",
    fontSize: FontSize.lg,
  },
});
