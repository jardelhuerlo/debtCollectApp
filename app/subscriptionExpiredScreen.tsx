import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function SubscriptionExpiredScreen() {
  const router = useRouter();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/loginScreen");
  };

  return (
    <View
      style={{
        flex: 1,
        padding: 20,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
      }}
    >
      <Text style={{ fontSize: 26, fontWeight: "bold", marginBottom: 10 }}>
        Suscripción expirada
      </Text>

      <Text style={{ fontSize: 16, color: "#555", textAlign: "center" }}>
        Tu suscripción ha expirado. Contacta con soporte para reactivarla.
      </Text>

      <TouchableOpacity
        onPress={() => router.replace("/(tabs)/userScreen")}
        style={{
          marginTop: 30,
          backgroundColor: "#007bff",
          paddingVertical: 14,
          paddingHorizontal: 30,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>
          Ir a mi perfil
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={signOut}
        style={{
          marginTop: 30,
          backgroundColor: "#ff4d4d",
          paddingVertical: 14,
          paddingHorizontal: 30,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>
          Cerrar sesión
        </Text>
      </TouchableOpacity>
    </View>
  );
}
