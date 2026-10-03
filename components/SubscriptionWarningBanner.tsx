import { View, Text, StyleSheet } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface Props {
  daysRemaining: number;
}

export function SubscriptionWarningBanner({ daysRemaining }: Props) {
  if (daysRemaining > 2 || daysRemaining <= 0) return null;

  const message =
    daysRemaining === 1
      ? "Tu suscripción vence mañana"
      : `Tu suscripción vence en ${daysRemaining} días`;

  return (
    <View style={s.banner}>
      <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#92400e" />
      <Text style={s.text}>{message}. Contacta al administrador.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    backgroundColor: "#fef3c7",
    borderBottomWidth: 1,
    borderBottomColor: "#fde68a",
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    color: "#92400e",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
});
