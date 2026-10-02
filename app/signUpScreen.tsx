import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { getPasswordStrength } from "../constants/auth";
import { useAuth } from "../hooks/useAuth";
import { signUpSchema } from "../lib/validation";
import { showSuccess, showError } from "../lib/toast";
import { logger } from "../lib/logger";
import { Colors, Styles, FontSize } from "../constants/styles";

type SignUpForm = z.infer<typeof signUpSchema>;

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, isSigningUp } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
    clearErrors,
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptedTerms: false,
    },
    mode: "onSubmit",
  });

  const strength = getPasswordStrength(password);

  const onSubmit = async (data: SignUpForm) => {
    Keyboard.dismiss();
    const { error, session } = await signUp(data.email, data.password, data.fullName);

    if (error) {
      logger.error("Sign up failed", error);
      if (error.message.toLowerCase().includes("already registered")) {
        showError("Correo en uso", "Este correo ya tiene una cuenta. Intenta iniciar sesión.");
      } else {
        showError("Error", "Error de conexión. Verifica tu internet e intenta de nuevo.");
      }
      return;
    }

    if (session) {
      router.replace("/(tabs)/loans-historyScreen");
    } else {
      showSuccess(
        "¡Registro exitoso!",
        "Te enviamos un correo de verificación. Revisa tu bandeja de entrada y spam."
      );
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView
      style={Styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={Styles.formWrap}>
          <Text style={Styles.title}>Crear Cuenta</Text>
          <Text style={Styles.subtitle}>Regístrate para comenzar a usar la app</Text>

          <View style={Styles.inputWrap}>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="Nombre completo"
                  placeholderTextColor={Colors.placeholder}
                  autoCapitalize="words"
                  returnKeyType="next"
                  value={value}
                  onChangeText={(text) => {
                    onChange(text);
                    if (errors.fullName) clearErrors("fullName");
                  }}
                  onSubmitEditing={() => emailRef.current?.focus()}
                  style={[Styles.input, errors.fullName && Styles.inputDanger]}
                />
              )}
            />
            {errors.fullName && <Text style={Styles.error}>{errors.fullName.message}</Text>}
          </View>

          <View style={Styles.inputWrap}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  ref={emailRef}
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

          <View style={s.passWrap}>
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
                    returnKeyType="next"
                    value={value}
                    onChangeText={(text) => {
                      onChange(text);
                      setPassword(text);
                      if (errors.password) clearErrors("password");
                    }}
                    onFocus={() => scrollRef.current?.scrollToEnd({ animated: true })}
                    onSubmitEditing={() => confirmRef.current?.focus()}
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

            {password.length > 0 && (
              <View style={s.strengthWrap}>
                <View style={s.strengthBar}>
                  {(["weak", "medium", "strong"] as const).map((level, i) => (
                    <View
                      key={i}
                      style={[
                        s.strengthSegment,
                        {
                          backgroundColor:
                            (strength.level === "weak" && i === 0) ||
                            (strength.level === "medium" && i <= 1) ||
                            strength.level === "strong"
                              ? strength.color
                              : Colors.border,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[s.strengthLabel, { color: strength.color }]}>
                  Contraseña {strength.label}
                </Text>
              </View>
            )}

            {errors.password && <Text style={Styles.error}>{errors.password.message}</Text>}
          </View>

          <View style={s.confirmWrap}>
            <View style={[Styles.inputRow, errors.confirmPassword && Styles.inputRowDanger]}>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    ref={confirmRef}
                    placeholder="Confirmar contraseña"
                    placeholderTextColor={Colors.placeholder}
                    secureTextEntry={!showConfirm}
                    returnKeyType="done"
                    value={value}
                    onChangeText={(text) => {
                      onChange(text);
                      if (errors.confirmPassword) clearErrors("confirmPassword");
                    }}
                    onFocus={() => scrollRef.current?.scrollToEnd({ animated: true })}
                    onSubmitEditing={handleSubmit(onSubmit)}
                    style={Styles.inputFlex}
                  />
                )}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={s.eyeBtn}>
                <Ionicons
                  name={showConfirm ? "eye-off" : "eye"}
                  size={22}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={Styles.error}>{errors.confirmPassword.message}</Text>
            )}
          </View>

          <View style={s.termsWrap}>
            <Controller
              control={control}
              name="acceptedTerms"
              render={({ field: { onChange, value } }) => (
                <TouchableOpacity
                  onPress={() => {
                    onChange(!value);
                    if (errors.acceptedTerms) clearErrors("acceptedTerms");
                  }}
                  style={s.termsBtn}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      s.checkbox,
                      {
                        borderColor: value ? Colors.primary : "#cbd5e1",
                        backgroundColor: value ? Colors.primary : Colors.surface,
                      },
                    ]}
                  >
                    {value && <Ionicons name="checkmark" size={14} color="white" />}
                  </View>
                  <Text style={s.termsText}>
                    Acepto los <Text style={s.termsLink}>Términos y Condiciones</Text> y la{" "}
                    <Text style={s.termsLink}>Política de Privacidad</Text>
                  </Text>
                </TouchableOpacity>
              )}
            />
            {errors.acceptedTerms && (
              <Text style={[Styles.error, { marginTop: 0, marginBottom: 12 }]}>
                {errors.acceptedTerms.message}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={isSigningUp}
            style={[Styles.btnPrimary, isSigningUp && Styles.btnPrimaryDisabled]}
          >
            {isSigningUp ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={Styles.btnPrimaryText}>Registrarse</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={Styles.link}>
              ¿Ya tienes cuenta? <Text style={Styles.linkBold}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll: { flexGrow: 1 },
  eyeBtn: { paddingHorizontal: 14 },
  passWrap: { width: "100%", marginBottom: 6 },
  strengthWrap: { marginTop: 8 },
  strengthBar: { flexDirection: "row", gap: 4, marginBottom: 4 },
  strengthSegment: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: FontSize.xs, marginLeft: 2 },
  confirmWrap: { width: "100%", marginBottom: 20 },
  termsWrap: { width: "100%", marginBottom: 24 },
  termsBtn: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  termsText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  termsLink: { color: Colors.link, fontWeight: "600" },
});
