import { supabase } from "@/lib/supabase";
import { AppIcon } from "@/components/ui/app-icon";
import { IconLabel } from "@/components/ui/icon-label";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View, StyleSheet, Linking } from "react-native";
import { Colors, Styles, FontSize, Radius, Spacing } from "../constants/styles";
import { checkSubscription } from "@/services/profile.service";

// TODO: Reemplazar con el número de WhatsApp de soporte (+593XXXXXXXXX)
const SUPPORT_WHATSAPP = "";

export default function SubscriptionExpiredScreen() {
  const router = useRouter();
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  useEffect(() => {
    const check = async () => {
      const user = await supabase.auth.getUser().then((r) => r.data.user);
      if (!user) return;
      const status = await checkSubscription(user.id);
      setDaysRemaining(status.daysRemaining);
      setExpiresAt(status.expiresAt);
    };
    check();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/loginScreen");
  };

  const contactSupport = () => {
    if (SUPPORT_WHATSAPP) {
      Linking.openURL(`https://wa.me/${SUPPORT_WHATSAPP}`);
    }
  };

  return (
    <View style={s.container}>
      <View style={s.iconWrap}>
        <AppIcon name="lock" size={44} color="#dc2626" />
      </View>

      <Text style={s.heading}>Suscripción Expirada</Text>

      <Text style={s.description}>
        Tu suscripción ha expirado. Para seguir usando PayTrack, contacta con soporte para
        reactivarla.
      </Text>

      {expiresAt && (
        <View style={s.infoCard}>
          <Text style={s.infoLabel}>Expiró el:</Text>
          <Text style={s.infoValue}>
            {expiresAt.toLocaleDateString("es-EC", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </Text>
        </View>
      )}

      {SUPPORT_WHATSAPP ? (
        <TouchableOpacity onPress={contactSupport} style={s.primaryBtn}>
          <IconLabel icon="chat" color="#ffffff" textStyle={s.btnText}>
            Contactar Soporte para Renovar
          </IconLabel>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity onPress={signOut} style={s.dangerBtn}>
        <Text style={s.btnText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xxl,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.surface,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.deleteBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  icon: { fontSize: 40 },
  heading: {
    fontSize: FontSize.title,
    fontWeight: "bold",
    marginBottom: Spacing.md,
    color: Colors.text,
    textAlign: "center",
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  infoCard: {
    backgroundColor: Colors.backgroundGray,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
    width: "100%",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    color: Colors.text,
  },
  primaryBtn: {
    width: "100%",
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  secondaryBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  secondaryBtnText: { color: Colors.textSecondary, fontSize: FontSize.lg },
  dangerBtn: {
    width: "100%",
    backgroundColor: Colors.delete,
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  btnText: {
    color: Colors.surface,
    fontWeight: "bold",
    fontSize: FontSize.lg,
  },
});
