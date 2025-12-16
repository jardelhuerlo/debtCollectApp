import { Ionicons } from "@expo/vector-icons";
import * as Linking from 'expo-linking';
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
import { supabase } from "../lib/supabase";

export default function SignUpScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");   // 👈 Nuevo campo
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 👁️
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !fullName) {
      Alert.alert("Error", "Debes ingresar tu nombre, email y contraseña.");
      return;
    }

    setLoading(true);

    const redirectUrl = Linking.createURL('/(tabs)/loans-historyScreen');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,  // 👈 IMPORTANTE: esto llega a tu trigger
        }
      },
    });

    setLoading(false);

    if (error) {
      Alert.alert("Error al registrarse", error.message);
      return;
    }

    if (data.session) {
      router.replace("/(tabs)/loans-historyScreen");
    } else {
      Alert.alert(
        "Registro exitoso",
        "Por favor verifica tu correo electrónico para confirmar tu cuenta."
      );
      router.back();
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
        <Text style={{ fontSize: 26, fontWeight: "bold", marginBottom: 6, color: "#1e293b" }}>
          Crear Cuenta
        </Text>

        <Text style={{ fontSize: 14, color: "#64748b", marginBottom: 25, textAlign: "center" }}>
          Registrate para comenzar a usar la app
        </Text>

        {/* Nombre */}
        <TextInput
          placeholder="Nombre completo"
          placeholderTextColor="#94a3b8"
          value={fullName}
          onChangeText={setFullName}
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

        {/* Email */}
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
              color: "#1e293b",
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

        {/* Botón */}
        <TouchableOpacity
          onPress={handleSignUp}
          disabled={loading}
          style={{
            width: "100%",
            backgroundColor: "#2563eb",
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
            elevation: 4,
            marginBottom: 20,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "white", fontSize: 17, fontWeight: "600" }}>
              Registrarse
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "#2563eb", fontSize: 16 }}>
            ¿Ya tienes cuenta? Inicia sesión
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
