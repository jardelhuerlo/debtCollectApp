import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as Haptics from "expo-haptics";
import { useCreateLoanMutation, useLoansQuery } from "@/hooks/useQueryLoans";
import { getLoanClientName, normalizeClientName, suggestClientNames } from "@/lib/clients";
import { loanSchema } from "@/lib/validation";
import { showSuccess, showError } from "@/lib/toast";
import { logger } from "@/lib/logger";
import { Colors, FontSize, Radius, Spacing, Styles } from "@/constants/styles";
import type { PaymentMethod } from "@/types";

type LoanForm = z.infer<typeof loanSchema>;

export default function LoansScreen() {
  const router = useRouter();
  const createLoanMutation = useCreateLoanMutation();
  const allLoans = useLoansQuery().data ?? [];

  const {
    control,
    handleSubmit,
    formState: { errors },
    clearErrors,
    reset,
    watch,
  } = useForm<LoanForm>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      debtor_name: "",
      amount: "",
      interes: "",
      payment_method: "efectivo",
      note: "",
    },
    mode: "onSubmit",
  });

  const amount = watch("amount");
  const interes = watch("interes");

  const calculatePreview = () => {
    const a = Number(amount);
    const i = Number(interes);
    if (isNaN(a) || isNaN(i) || a <= 0 || i < 0) return null;
    return a + a * (i / 100);
  };

  const onSubmit = (data: LoanForm) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    createLoanMutation.mutate(
      {
        debtorName: data.debtor_name,
        amount: Number(data.amount),
        interes: Number(data.interes),
        paymentMethod: data.payment_method,
        note: data.note || "",
      },
      {
        onSuccess: () => {
          showSuccess("Éxito", "Préstamo registrado correctamente.");
          reset();
          router.replace("/loans-historyScreen");
        },
        onError: (error) => {
          logger.error("Create loan failed", error);
          showError("Error", "No se pudo registrar el préstamo.");
        },
      }
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <SafeAreaView style={Styles.screen}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          <Text style={s.heading}>Registrar Préstamo</Text>

          <Text style={Styles.label}>Nombre del cliente</Text>
          <Controller
            control={control}
            name="debtor_name"
            render={({ field: { onChange, value } }) => {
              const suggestions = suggestClientNames(allLoans, value);
              const isExisting =
                value.trim().length > 0 &&
                allLoans.some(
                  (l) => normalizeClientName(getLoanClientName(l)) === normalizeClientName(value)
                );
              return (
                <>
                  <TextInput
                    placeholder="Ej: Juan Pérez"
                    placeholderTextColor={Colors.placeholder}
                    value={value}
                    onChangeText={(text) => {
                      onChange(text);
                      if (errors.debtor_name) clearErrors("debtor_name");
                    }}
                    style={[Styles.input, errors.debtor_name && Styles.inputDanger]}
                  />
                  {suggestions.length > 0 && (
                    <View style={s.suggestBox}>
                      {suggestions.map((name) => (
                        <TouchableOpacity
                          key={name}
                          style={s.suggestRow}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            onChange(name);
                            if (errors.debtor_name) clearErrors("debtor_name");
                          }}
                        >
                          <Text style={s.suggestText}>👤 {name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {isExisting && (
                    <Text style={s.existingHint}>
                      ✔ Cliente existente: se agregará un nuevo crédito a su nombre.
                    </Text>
                  )}
                </>
              );
            }}
          />
          {errors.debtor_name && <Text style={Styles.error}>{errors.debtor_name.message}</Text>}

          <Text style={Styles.label}>Monto del préstamo</Text>
          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, value } }) => (
              <TextInput
                placeholder="Ej: 150.00"
                placeholderTextColor={Colors.placeholder}
                keyboardType="numeric"
                value={value}
                onChangeText={(text) => {
                  onChange(text);
                  if (errors.amount) clearErrors("amount");
                }}
                style={[Styles.input, errors.amount && Styles.inputDanger]}
              />
            )}
          />
          {errors.amount && <Text style={Styles.error}>{errors.amount.message}</Text>}

          <Text style={Styles.label}>Interés (%)</Text>
          <Controller
            control={control}
            name="interes"
            render={({ field: { onChange, value } }) => (
              <TextInput
                placeholder="Ej: 10"
                placeholderTextColor={Colors.placeholder}
                keyboardType="numeric"
                value={value}
                onChangeText={(text) => {
                  onChange(text);
                  if (errors.interes) clearErrors("interes");
                }}
                style={[Styles.input, errors.interes && Styles.inputDanger]}
              />
            )}
          />
          {errors.interes && <Text style={Styles.error}>{errors.interes.message}</Text>}

          {calculatePreview() !== null && (
            <Text style={s.preview}>Total con interés: {calculatePreview()?.toFixed(2)} USD</Text>
          )}

          <Text style={Styles.label}>Método de pago</Text>
          <View style={s.payRow}>
            {(["efectivo", "transferencia"] as const).map((method) => (
              <Controller
                key={method}
                control={control}
                name="payment_method"
                render={({ field: { onChange, value } }) => (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onChange(method);
                    }}
                    style={[
                      s.payOption,
                      { backgroundColor: value === method ? Colors.paymentEfectivo : "#eee" },
                    ]}
                  >
                    <Text
                      style={[
                        s.payOptionText,
                        { color: value === method ? Colors.surface : Colors.text },
                      ]}
                    >
                      {method}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            ))}
          </View>

          <Text style={Styles.label}>Nota (opcional)</Text>
          <Controller
            control={control}
            name="note"
            render={({ field: { onChange, value } }) => (
              <TextInput
                placeholder="Ej: Cliente paga puntual..."
                placeholderTextColor={Colors.placeholder}
                value={value}
                onChangeText={onChange}
                style={[Styles.input, s.noteInput]}
                multiline
              />
            )}
          />

          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={createLoanMutation.isPending}
            style={[s.saveBtn, createLoanMutation.isPending && { opacity: 0.6 }]}
          >
            {createLoanMutation.isPending && (
              <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
            )}
            <Text style={s.saveBtnText}>Guardar Préstamo</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.xxl },
  suggestBox: {
    marginTop: -4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    overflow: "hidden",
  },
  suggestRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  suggestText: { fontSize: FontSize.lg, color: Colors.text },
  existingHint: { marginBottom: 8, fontSize: FontSize.md, color: Colors.success },
  heading: { fontSize: FontSize.title, fontWeight: "bold", marginBottom: 20, color: Colors.text },
  preview: {
    fontSize: FontSize.xxl,
    marginTop: -5,
    marginBottom: 15,
    fontWeight: "bold",
    color: Colors.primaryDark,
  },
  payRow: { flexDirection: "row", marginVertical: 10 },
  payOption: { padding: 10, borderRadius: Radius.md, marginRight: 10 },
  payOptionText: { fontWeight: "bold", textTransform: "capitalize" },
  noteInput: { minHeight: 80, textAlignVertical: "top" },
  saveBtn: {
    backgroundColor: Colors.primaryDark,
    padding: 15,
    borderRadius: Radius.md,
    alignItems: "center",
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "center",
    elevation: 3,
  },
  saveBtnText: { color: Colors.surface, fontSize: FontSize.lg, fontWeight: "bold" },
});
