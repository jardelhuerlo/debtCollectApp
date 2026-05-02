import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
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
import { showSuccess, showError } from "../lib/toast";
import { logger } from "../lib/logger";
import { Colors, Styles, FontSize } from "../constants/styles";

type ForgotForm = Pick<z.infer<typeof loginSchema>, "email">;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword, isResetting } = useAuth();
  const [sent, setSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    clearErrors,
    watch,
  } = useForm<ForgotForm>({
    resolver: zodResolver(loginSchema.pick({ email: true })),
    defaultValues: { email: "" },
    mode: "onSubmit",
  });

  const onSubmit = async (data: ForgotForm) => {
    Keyboard.dismiss();
    const { error } = await resetPassword(data.email);
    if (error) {
      logger.error("Password reset failed", error);
      showError("Error", "Error de conexión. Verifica tu internet e intenta de nuevo.");
      return;
    }
    setSent(true);
    showSuccess("Correo enviado", `Revisa la bandeja de entrada de ${data.email}`);
  };

  return (
    <KeyboardAvoidingView
      style={Styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={s.container}>
        <TouchableOpacity onPress={() => router.back()} style={Styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color={Colors.text} />
        </TouchableOpacity>

        <View style={Styles.iconCircle}>
          <Ionicons name="lock-closed-outline" size={34} color={Colors.primary} />
        </View>

        <Text style={s.heading}>¿Olvidaste tu contraseña?</Text>

        {!sent ? (
          <>
            <Text style={s.description}>
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </Text>

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
                    returnKeyType="send"
                    value={value}
                    onChangeText={(text) => {
                      onChange(text);
                      if (errors.email) clearErrors("email");
                    }}
                    onSubmitEditing={handleSubmit(onSubmit)}
                    style={[Styles.input, errors.email && Styles.inputDanger]}
                  />
                )}
              />
              {errors.email && <Text style={Styles.error}>{errors.email.message}</Text>}
            </View>

            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={isResetting}
              style={[
                Styles.btnPrimary,
                isResetting && Styles.btnPrimaryDisabled,
                { marginBottom: 0 },
              ]}
            >
              {isResetting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={Styles.btnPrimaryText}>Enviar enlace</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View style={s.sentWrap}>
            <View style={s.sentIconWrap}>
              <Ionicons name="checkmark-circle" size={40} color={Colors.success} />
            </View>
            <Text style={s.sentText}>
              Correo enviado a <Text style={s.sentEmail}>{watch("email")?.trim()}</Text>.{"\n"}
              Revisa tu bandeja de entrada y spam.
            </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={[Styles.link, Styles.linkBold]}>Volver al inicio de sesión</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  heading: { fontSize: FontSize.title, fontWeight: "bold", color: Colors.text, marginBottom: 8 },
  description: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 20,
  },
  sentWrap: { alignItems: "center" },
  sentIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.successBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  sentText: {
    fontSize: FontSize.lg,
    color: Colors.text,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 28,
  },
  sentEmail: { fontWeight: "700" },
});
