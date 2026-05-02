import React, { useCallback, useMemo, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { Colors, Radius, FontSize, Spacing } from "@/constants/styles";
import * as Haptics from "expo-haptics";

interface ConfirmBottomSheetProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmBottomSheet({
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  confirmVariant = "danger",
  onConfirm,
  onCancel,
}: ConfirmBottomSheetProps) {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["25%"], []);

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onConfirm();
    sheetRef.current?.close();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
    sheetRef.current?.close();
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    []
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: Colors.surface }}
    >
      <View style={s.content}>
        <Text style={s.title}>{title}</Text>
        <Text style={s.message}>{message}</Text>

        <View style={s.btnRow}>
          <TouchableOpacity style={[s.btn, s.btnCancel]} onPress={handleCancel}>
            <Text style={s.btnCancelText}>{cancelLabel}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.btn, confirmVariant === "danger" ? s.btnDanger : s.btnPrimary]}
            onPress={handleConfirm}
          >
            <Text style={s.btnText}>{confirmLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  content: { padding: Spacing.xl, alignItems: "center" },
  title: { fontSize: FontSize.xxl, fontWeight: "bold", color: Colors.text, marginBottom: 8 },
  message: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
  },
  btnRow: { flexDirection: "row", gap: 12, width: "100%" },
  btn: { flex: 1, padding: 14, borderRadius: Radius.md, alignItems: "center" },
  btnCancel: { backgroundColor: Colors.greenBg },
  btnCancelText: { color: Colors.text, fontWeight: "600" },
  btnDanger: { backgroundColor: Colors.delete },
  btnPrimary: { backgroundColor: Colors.primary },
  btnText: { color: Colors.surface, fontWeight: "bold", fontSize: FontSize.md },
});
