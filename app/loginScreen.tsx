import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 👁️
  const [loading, setLoading] = useState(false);

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
        {/* Avatar */}
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

        {/* EMAIL */}
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

        {/* PASSWORD + 👁️ */}
        <View
          style={{
            width: "100%",
            backgroundColor: "white",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#e2e8f0",
            marginBottom: 20,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TextInput
            placeholder="Contraseña"
            placeholderTextColor="#94a3b8"
            secureTextEntry={!showPassword} // 🔑 asteriscos
            value={password}
            onChangeText={setPassword}
            style={{
              flex: 1,
              padding: 14,
              fontSize: 16,
            }}
          />

          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={{ paddingHorizontal: 14 }}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={22}
              color="#64748b"
            />
          </TouchableOpacity>
        </View>

        {/* BOTÓN LOGIN */}
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

        <TouchableOpacity
          onPress={() => router.push("/signUpScreen")}
          style={{ marginTop: 20 }}
        >
          <Text style={{ color: "#2563eb", fontSize: 16 }}>
            ¿No tienes cuenta? Regístrate
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
