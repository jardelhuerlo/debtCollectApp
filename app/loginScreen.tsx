import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { supabase } from "../lib/supabase";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Si ya existe una sesión, navegar
  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        router.replace("/(tabs)/loans-historyScreen");

      }
    })();
  }, [router]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Debes ingresar tu email y contraseña.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      Alert.alert("Error al iniciar sesión", "Correo o contraseña incorrecta");
      return;
    }

    if (data.session?.user) {
      router.replace("/(tabs)/loans-historyScreen");

    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "#f8fafc",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 30,
        }}
      >
        {/* Avatar con iniciales del sistema */}
        <View
          style={{
            width: 90,
            height: 90,
            borderRadius: 45,
            backgroundColor: "#2563eb20",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 25,
          }}
        >
          <Text style={{ fontSize: 36, fontWeight: "bold", color: "#2563eb" }}>
            IN
          </Text>
        </View>

        <Text
          style={{
            fontSize: 26,
            fontWeight: "bold",
            marginBottom: 6,
            color: "#1e293b",
          }}
        >
          Bienvenido
        </Text>

        <Text
          style={{
            fontSize: 14,
            color: "#64748b",
            marginBottom: 25,
            textAlign: "center",
          }}
        >
          Ingresa con tu correo y contraseña para continuar
        </Text>

        {/* Input email */}
        <TextInput
          placeholder="Correo electrónico"
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={{
            width: "100%",
            backgroundColor: "white",
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: "#e2e8f0",
            marginBottom: 14,
            fontSize: 16,
          }}
        />

        {/* Input password */}
        <TextInput
          placeholder="Contraseña"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={{
            width: "100%",
            backgroundColor: "white",
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: "#e2e8f0",
            marginBottom: 20,
            fontSize: 16,
          }}
        />

        {/* Botón */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            backgroundColor: "#2563eb",
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
            shadowColor: "#2563eb",
            shadowOpacity: 0.25,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "white", fontSize: 17, fontWeight: "600" }}>
              Iniciar sesión
            </Text>
          )}
        </TouchableOpacity>

      </View>
    </KeyboardAvoidingView>
  );
}
