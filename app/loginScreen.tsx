import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../hooks/useAuth";
import { loginSchema } from "../lib/validation";
import { showError } from "../lib/toast";
import { logger } from "../lib/logger";
import { Colors, Styles, FontSize } from "../constants/styles";

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isSigningIn, session } = useAuth();
  const passwordRef = useRef<TextInput>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  });

  useEffect(() => {
    if (session) {
      router.replace("/(tabs)/loans-historyScreen");
    }
  }, [session, router]);

  const onSubmit = async (data: LoginForm) => {
    Keyboard.dismiss();
    const { error } = await signIn(data.email, data.password);

    if (error) {
      logger.error("Login failed", error);
      if (
        error.message.toLowerCase().includes("invalid") ||
        error.message.toLowerCase().includes("credentials")
      ) {
        setError("password", { message: "Correo o contraseña incorrectos." });
      } else {
        showError("Error de conexión", "Verifica tu internet e intenta de nuevo.");
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={Styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={Styles.formWrap}>
          <View style={s.logoWrap}>
            <Image source={require("../assets/images/icon.png")} style={s.logo} />
          </View>

          <Text style={Styles.title}>Bienvenido</Text>
          <Text style={Styles.subtitle}>Ingresa con tu correo y contraseña para continuar</Text>

          <View style={Styles.inputWrap}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="Correo electrónico"
                  placeholderTextColor={Colors.placeholder}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                  value={value}
                  onChangeText={(text) => {
                    onChange(text);
                    if (errors.email) clearErrors("email");
                  }}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  style={[Styles.input, errors.email && Styles.inputDanger]}
                />
              )}
            />
            {errors.email && <Text style={Styles.error}>{errors.email.message}</Text>}
          </View>

          <View style={Styles.inputWrap}>
            <View style={[Styles.inputRow, errors.password && Styles.inputRowDanger]}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    ref={passwordRef}
                    placeholder="Contraseña"
                    placeholderTextColor={Colors.placeholder}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    value={value}
                    onChangeText={(text) => {
                      onChange(text);
                      if (errors.password) clearErrors("password");
                    }}
                    onSubmitEditing={handleSubmit(onSubmit)}
                    style={Styles.inputFlex}
                  />
                )}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={22}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={Styles.error}>{errors.password.message}</Text>}
          </View>

          <TouchableOpacity
            onPress={() => router.push("/forgotPasswordScreen")}
            style={s.forgotBtn}
          >
            <Text style={s.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={isSigningIn}
            style={[Styles.btnPrimary, isSigningIn && Styles.btnPrimaryDisabled]}
          >
            {isSigningIn ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={Styles.btnPrimaryText}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/signUpScreen")}>
            <Text style={Styles.link}>
              ¿No tienes cuenta? <Text style={Styles.linkBold}>Regístrate</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll: { flexGrow: 1 },
  logoWrap: {
    width: 90,
    height: 90,
    borderRadius: 25,
    backgroundColor: Colors.primaryBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 25,
  },
  logo: { width: 90, height: 90, borderRadius: 25 },
  eyeBtn: { paddingHorizontal: 14 },
  forgotBtn: { alignSelf: "flex-end", marginBottom: 24 },
  forgotText: { color: Colors.link, fontSize: FontSize.sm },
});
