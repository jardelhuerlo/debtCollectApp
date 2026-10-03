import { useRouter } from "expo-router";
import { AppIcon } from "@/components/ui/app-icon";
import { IconLabel } from "@/components/ui/icon-label";
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { Colors, Styles, FontSize, Radius, Spacing } from "@/constants/styles";
import { showError, showSuccess } from "@/lib/toast";
import { checkSubscription } from "@/services/profile.service";
import type { SubscriptionStatus } from "@/services/profile.service";

export default function SubscribeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    const check = async () => {
      const user = await supabase.auth.getUser().then((r) => r.data.user);
      if (!user) {
        router.replace("/loginScreen");
        return;
      }
      const status = await checkSubscription(user.id);
      setSubStatus(status);
      setChecking(false);
    };
    check();
  }, []);

  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      if (!url.startsWith("debtcollectapp://subscribe")) return;
      if (url.includes("success=true")) {
        const user = await supabase.auth.getUser().then((r) => r.data.user);
        if (!user) return;

        let isActive = false;
        for (let i = 0; i < 10; i++) {
          await new Promise((r) => setTimeout(r, 2000));
          const status = await checkSubscription(user.id);
          if (status.isActive) {
            isActive = true;
            break;
          }
        }

        if (isActive) {
          showSuccess("¡Pago exitoso!", "Tu suscripción ha sido activada.");
          router.replace("/(tabs)/loans-historyScreen");
        } else {
          showError("Pendiente", "Tu pago se está procesando. Intenta en unos minutos.");
          setSubStatus(await checkSubscription(user.id));
        }
      } else if (url.includes("canceled=true")) {
        showError("Pago cancelado", "El pago fue cancelado. Inténtalo de nuevo.");
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url && url.startsWith("debtcollectapp://subscribe")) handleDeepLink({ url });
    });

    const subscription = Linking.addEventListener("url", handleDeepLink);
    return () => subscription.remove();
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const user = await supabase.auth.getUser().then((r) => r.data.user);
      if (!user) {
        showError("Error", "Debes iniciar sesión primero.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { userId: user.id },
      });

      if (error || !data?.url) {
        showError("Error", "No se pudo iniciar el proceso de pago.");
        setLoading(false);
        return;
      }

      await Linking.openURL(data.url);
    } catch (err) {
      showError("Error", "No se pudo conectar con Stripe.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <View style={[Styles.center, { backgroundColor: Colors.surface }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (subStatus?.isActive) {
    return (
      <View style={[s.container, { paddingTop: insets.top + Spacing.xxl }]}>
        <View style={s.iconWrap}>
          <AppIcon name="check-circle" size={44} color="#22c55e" />
        </View>
        <Text style={s.heading}>Suscripción Activa</Text>
        <Text style={s.description}>
          Ya tienes una suscripción activa. Expira en {subStatus.daysRemaining}{" "}
          {subStatus.daysRemaining === 1 ? "día" : "días"}.
        </Text>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/userScreen")} style={s.primaryBtn}>
          <Text style={s.btnText}>Ir a mi perfil</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top + Spacing.xxl }]}>
      <View style={s.iconWrap}>
        <AppIcon name="star" size={44} color="#f59e0b" />
      </View>

      <Text style={s.heading}>PayTrack Premium</Text>
      <Text style={s.description}>
        Desbloquea todas las funciones y gestiona tus préstamos sin límites.
      </Text>

      <View style={s.planCard}>
        <View style={s.planRow}>
          <Text style={s.planName}>Plan Mensual</Text>
          <Text style={s.planPrice}>$5 USD/mes</Text>
        </View>
        <View style={s.planFeatures}>
          <IconLabel icon="check" iconColor="#16a34a" color={Colors.text} textStyle={s.feature}>
            Préstamos ilimitados
          </IconLabel>
          <IconLabel icon="check" iconColor="#16a34a" color={Colors.text} textStyle={s.feature}>
            Historial completo de pagos
          </IconLabel>
          <IconLabel icon="check" iconColor="#16a34a" color={Colors.text} textStyle={s.feature}>
            Exportar reportes PDF
          </IconLabel>
          <IconLabel icon="check" iconColor="#16a34a" color={Colors.text} textStyle={s.feature}>
            Soporte prioritario
          </IconLabel>
        </View>
      </View>

      <View style={s.comingSoonBox}>
        <Text style={s.comingSoonText}>Los pagos en línea estarán disponibles próximamente.</Text>
        <Text style={s.comingSoonSub}>Contacta con soporte para renovar tu suscripción.</Text>
      </View>

      <TouchableOpacity onPress={() => router.back()} style={s.secondaryBtn}>
        <Text style={s.secondaryBtnText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xxl,
    backgroundColor: Colors.surface,
    alignItems: "center",
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  icon: { fontSize: 40 },
  heading: {
    fontSize: FontSize.title,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  planCard: {
    width: "100%",
    backgroundColor: Colors.backgroundGray,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  planRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  planName: { fontSize: FontSize.xl, fontWeight: "bold", color: Colors.text },
  planPrice: { fontSize: FontSize.xl, fontWeight: "bold", color: Colors.primary },
  planFeatures: { gap: 8 },
  feature: { fontSize: FontSize.md, color: Colors.text },
  primaryBtn: {
    width: "100%",
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: Radius.md,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  secondaryBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  secondaryBtnText: { color: Colors.textSecondary, fontSize: FontSize.lg },
  btnText: {
    color: Colors.surface,
    fontWeight: "bold",
    fontSize: FontSize.lg,
  },
  comingSoonBox: {
    width: "100%",
    backgroundColor: Colors.backgroundGray,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xxl,
    alignItems: "center",
  },
  comingSoonText: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  comingSoonSub: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
