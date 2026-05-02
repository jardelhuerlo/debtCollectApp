import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { Colors, Styles, FontSize, Radius } from "../constants/styles";

export default function SubscriptionExpiredScreen() {
  const router = useRouter();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/loginScreen");
  };

  return (
    <View style={s.container}>
      <Text style={s.heading}>Suscripción expirada</Text>

      <Text style={s.description}>
        Tu suscripción ha expirado. Contacta con soporte para reactivarla.
      </Text>

      <TouchableOpacity onPress={() => router.replace("/(tabs)/userScreen")} style={s.primaryBtn}>
        <Text style={s.btnText}>Ir a mi perfil</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={signOut} style={s.dangerBtn}>
        <Text style={s.btnText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.surface,
  },
  heading: {
    fontSize: FontSize.titleXl,
    fontWeight: "bold",
    marginBottom: 10,
    color: Colors.text,
  },
  description: {
    fontSize: FontSize.lg,
    color: Colors.textGray,
    textAlign: "center",
  },
  primaryBtn: {
    marginTop: 30,
    backgroundColor: "#007bff",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: Radius.md,
  },
  dangerBtn: {
    marginTop: 30,
    backgroundColor: Colors.delete,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: Radius.md,
  },
  btnText: {
    color: Colors.surface,
    fontWeight: "bold",
  },
});
