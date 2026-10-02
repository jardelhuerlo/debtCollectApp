import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { showSuccess, showError } from "@/lib/toast";
import { Colors, FontSize, Radius, Spacing } from "@/constants/styles";

interface UserProfile {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  is_active: boolean;
  subscription_expires: string | null;
  created_at: string;
}

export default function AdminScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    const { data, error } = await supabase.rpc("admin_get_all_profiles");
    if (error) {
      showError("Error", "No se pudo cargar los usuarios");
    } else {
      setUsers(data ?? []);
    }
  }, []);

  useEffect(() => {
    loadUsers().finally(() => setLoading(false));
  }, [loadUsers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const toggleActive = async (user: UserProfile) => {
    setUpdating(user.id);
    const { error } = await supabase.rpc("admin_update_user", {
      target_user_id: user.id,
      new_is_active: !user.is_active,
      extend_subscription: false,
    });
    if (error) {
      showError("Error", "No se pudo actualizar el usuario");
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u))
      );
    }
    setUpdating(null);
  };

  const renewSubscription = async (user: UserProfile) => {
    setUpdating(user.id);
    const { error } = await supabase.rpc("admin_update_user", {
      target_user_id: user.id,
      new_is_active: true,
      extend_subscription: true,
    });
    if (error) {
      showError("Error", "No se pudo renovar la suscripción");
    } else {
      showSuccess("Renovado", `Suscripción de ${user.full_name} extendida al día 2`);
      await loadUsers();
    }
    setUpdating(null);
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isExpired = (user: UserProfile) => {
    if (!user.subscription_expires) return true;
    return new Date(user.subscription_expires) < new Date();
  };

  if (loading) {
    return (
      <SafeAreaView style={s.screen}>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.screen}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.title}>Panel Admin</Text>
        <Text style={s.subtitle}>{users.length} usuarios</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => {
          const expired = isExpired(item);
          const isUpdating = updating === item.id;

          return (
            <View style={[s.card, !item.is_active && s.cardInactive]}>
              <View style={s.cardTop}>
                <View style={s.userInfo}>
                  <Text style={s.name} numberOfLines={1}>
                    {item.full_name}
                  </Text>
                  <Text style={s.email} numberOfLines={1}>
                    {item.email ?? "—"}
                  </Text>
                  <Text style={[s.role, item.role === "admin" && s.roleAdmin]}>{item.role}</Text>
                </View>

                <View style={s.switchWrap}>
                  {isUpdating ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Switch
                      value={item.is_active}
                      onValueChange={() => toggleActive(item)}
                      trackColor={{ false: "#e2e8f0", true: "#bbf7d0" }}
                      thumbColor={item.is_active ? "#22c55e" : "#94a3b8"}
                    />
                  )}
                  <Text
                    style={[s.statusLabel, { color: item.is_active ? "#22c55e" : Colors.delete }]}
                  >
                    {item.is_active ? "Activo" : "Inactivo"}
                  </Text>
                </View>
              </View>

              <View style={s.cardBottom}>
                <Text style={[s.expiry, expired && s.expiryExpired]}>
                  Vence: {formatDate(item.subscription_expires)}
                  {expired ? " · Expirado" : ""}
                </Text>

                <TouchableOpacity
                  style={[s.renewBtn, isUpdating && { opacity: 0.5 }]}
                  onPress={() => renewSubscription(item)}
                  disabled={isUpdating}
                >
                  <Text style={s.renewBtnText}>Renovar al día 2</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    backgroundColor: "#1e293b",
  },
  backBtn: { marginBottom: 8 },
  backText: { color: "#94a3b8", fontSize: FontSize.sm },
  title: { color: "#fff", fontSize: FontSize.title, fontWeight: "bold" },
  subtitle: { color: "#94a3b8", fontSize: FontSize.sm, marginTop: 2 },
  list: { padding: Spacing.md, gap: Spacing.md },
  card: {
    backgroundColor: "#fff",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardInactive: { opacity: 0.7, borderLeftWidth: 3, borderLeftColor: Colors.delete },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  userInfo: { flex: 1, marginRight: Spacing.md },
  name: { fontSize: FontSize.lg, fontWeight: "700", color: "#0f172a" },
  email: { fontSize: FontSize.sm, color: "#64748b", marginTop: 2 },
  role: {
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: "#e2e8f0",
    color: "#475569",
    fontSize: FontSize.xs,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    textTransform: "capitalize",
  },
  roleAdmin: { backgroundColor: "#fef9c3", color: "#a16207" },
  switchWrap: { alignItems: "center", gap: 4 },
  statusLabel: { fontSize: FontSize.xs, fontWeight: "600" },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  expiry: { fontSize: FontSize.sm, color: "#64748b", flex: 1 },
  expiryExpired: { color: Colors.delete, fontWeight: "600" },
  renewBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  renewBtnText: { color: "#fff", fontSize: FontSize.sm, fontWeight: "700" },
});
