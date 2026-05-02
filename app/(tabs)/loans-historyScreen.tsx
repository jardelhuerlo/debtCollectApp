import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Print from "expo-print";
import { shareAsync } from "expo-sharing";
import * as Haptics from "expo-haptics";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import {
  useLoansQuery,
  useDeleteLoanMutation,
  usePaymentsQuery,
  useRegisterPaymentMutation,
  useRegisterZeroPaymentMutation,
} from "@/hooks/useQueryLoans";
import type { Loan, Payment, PaymentMethod } from "@/types";
import { showSuccess, showError } from "@/lib/toast";
import { logger } from "@/lib/logger";
import { Colors, Styles, FontSize, Radius, Shadow, Spacing } from "@/constants/styles";
import { CardSkeleton } from "@/components/SkeletonLoader";

export { Loan, Payment } from "@/types";

export default function LoansHistoryScreen() {
  const insets = useSafeAreaInsets();

  const loansQuery = useLoansQuery();
  const loans = loansQuery.data ?? [];
  const isLoading = loansQuery.isLoading;
  const isRefetching = loansQuery.isRefetching;
  const refetch = loansQuery.refetch;

  const deleteLoanMutation = useDeleteLoanMutation();

  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [paymentsModal, setPaymentsModal] = useState(false);
  const [historyLoan, setHistoryLoan] = useState<Loan | null>(null);

  const paymentsQuery = usePaymentsQuery(historyLoan?.id ?? null);
  const payments = paymentsQuery.data ?? [];

  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [newRemaining, setNewRemaining] = useState<number | null>(null);
  const [paymentNote, setPaymentNote] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo");

  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState<string | null>(null);
  const deleteSheetRef = useRef<BottomSheet>(null);

  const registerPaymentMutation = useRegisterPaymentMutation(() => {
    setModalVisible(false);
    setPaymentAmount("");
    setNewRemaining(null);
    setPaymentMethod("efectivo");
    setPaymentNote("");
    showSuccess("Éxito", "Pago registrado correctamente.");
  });

  const registerZeroPaymentMutation = useRegisterZeroPaymentMutation(() => {
    setModalVisible(false);
    setPaymentAmount("");
    setNewRemaining(null);
    setPaymentMethod("efectivo");
    setPaymentNote("");
    showSuccess("Éxito", "Día sin pago registrado correctamente.");
  });

  const isProcessing = registerPaymentMutation.isPending || registerZeroPaymentMutation.isPending;

  useEffect(() => {
    if (!selectedLoan) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount)) {
      setNewRemaining(selectedLoan.remaining);
    } else {
      setNewRemaining(selectedLoan.remaining - amount);
    }
  }, [paymentAmount, selectedLoan]);

  const generatePDF = async () => {
    if (!historyLoan) {
      showError("Error", "No se encontró información del préstamo.");
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; color: #333; }
            .header { margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9; }
            .header p { margin: 5px 0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .amount { font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #888; }
          </style>
        </head>
        <body>
          <h1>Reporte de Pagos</h1>
          <div class="header">
            <p><strong>Cliente:</strong> ${historyLoan.debtor_name}</p>
            <p><strong>Monto Original:</strong> $${historyLoan.original_amount}</p>
            <p><strong>Restante:</strong> $${historyLoan.remaining}</p>
            <p><strong>Interés:</strong> ${historyLoan.interes}%</p>
            <p><strong>Estado:</strong> ${historyLoan.status}</p>
            <p><strong>Fecha Inicio:</strong> ${new Date(historyLoan.created_at).toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr><th>Fecha</th><th>Monto</th><th>Método</th><th>Nota</th></tr>
            </thead>
            <tbody>
              ${(payments as Payment[])
                .map((p) => {
                  const isZeroPayment = p.amount === 0 || p.method === "sin_pago";
                  const methodText = isZeroPayment
                    ? "Sin pago"
                    : p.method === "efectivo"
                      ? "Efectivo"
                      : "Transferencia";
                  return `
                  <tr style="background-color: ${isZeroPayment ? "#fff0f0" : "#fff"}">
                    <td>${new Date(p.created_at).toLocaleDateString()} ${new Date(p.created_at).toLocaleTimeString()}</td>
                    <td class="amount">$${p.amount}</td>
                    <td>${methodText}</td>
                    <td>${p.note || "-"}</td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>
          <div class="footer">
            <p>Generado automáticamente desde DebtCollectApp</p>
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
    } catch (error) {
      logger.error("PDF generation failed", error);
      showError("Error", "No se pudo generar el PDF");
    }
  };

  const handleDeleteLoan = useCallback((id: string) => {
    setLoanToDelete(id);
    setDeleteSheetOpen(true);
    deleteSheetRef.current?.snapToIndex(0);
  }, []);

  const confirmDelete = useCallback(() => {
    if (loanToDelete) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      deleteLoanMutation.mutate(loanToDelete, {
        onError: () => {
          showError("Error", "No se pudo eliminar el préstamo");
        },
      });
    }
    deleteSheetRef.current?.close();
  }, [loanToDelete, deleteLoanMutation]);

  const openPaymentsModal = (loanId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHistoryLoan(loans.find((l) => l.id === loanId) || null);
    setPaymentsModal(true);
  };

  const handleRegisterPayment = () => {
    if (!selectedLoan) return;
    if (selectedLoan.remaining <= 0) {
      showError("Completado", "Este préstamo ya está completamente pagado.");
      return;
    }
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      showError("Error", "Ingresa un monto válido.");
      return;
    }

    registerPaymentMutation.mutate({
      loanId: selectedLoan.id,
      amount,
      note: paymentNote || undefined,
      method: paymentMethod,
    });
  };

  const handleRegisterZeroPayment = () => {
    if (!selectedLoan) return;
    registerZeroPaymentMutation.mutate(selectedLoan.id);
  };

  const renderLoan = ({ item }: { item: Loan }) => (
    <TouchableOpacity
      style={Styles.card}
      activeOpacity={0.7}
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
    >
      <View style={s.loanHeader}>
        <Text style={s.loanName}>{item.debtor_name}</Text>
        <TouchableOpacity
          onPress={() => handleDeleteLoan(item.id)}
          style={s.deleteBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol name="trash.fill" size={18} color="#a00" />
        </TouchableOpacity>
      </View>

      <Text style={s.loanDate}>{new Date(item.created_at).toLocaleDateString()}</Text>

      <Text style={s.loanRow}>
        💰 Restante: <Text style={{ fontWeight: "bold" }}>${item.remaining}</Text>
      </Text>

      <Text style={s.loanRow}>
        📈 Interés: <Text style={{ fontWeight: "bold" }}>{item.interes}%</Text>
      </Text>

      <View
        style={[
          Styles.loanBadge,
          {
            backgroundColor: item.status === "pendiente" ? Colors.badgeYellow : Colors.badgeGreen,
          },
        ]}
      >
        <Text style={{ color: Colors.text, fontWeight: "500" }}>{item.status}</Text>
      </View>

      {item.note && <Text style={s.loanNote}>📝 {item.note}</Text>}

      <View style={s.loanActions}>
        <TouchableOpacity
          style={Styles.loanCardBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setSelectedLoan(item);
            setModalVisible(true);
            setPaymentAmount("");
            setNewRemaining(item.remaining);
          }}
        >
          <Text>Registrar Pago</Text>
        </TouchableOpacity>

        <TouchableOpacity style={Styles.loanCardBtnBlue} onPress={() => openPaymentsModal(item.id)}>
          <Text style={{ fontWeight: "600" }}>Ver Pagos</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

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
    <View style={[Styles.safeTop, { paddingTop: insets.top + 10 }]}>
      <Text style={s.pageTitle}>Préstamos</Text>

      {isLoading ? (
        <View>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(item) => item.id}
          renderItem={renderLoan}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={<Text style={s.emptyText}>No hay préstamos registrados</Text>}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={Styles.modalOverlay}>
          <View style={Styles.modalContent}>
            {selectedLoan && (
              <>
                <Text style={Styles.modalTitle}>Detalles del Préstamo</Text>

                <Text>Cliente: {selectedLoan.debtor_name}</Text>
                <Text>Monto Original: ${selectedLoan.original_amount}</Text>
                <Text>Restante: ${selectedLoan.remaining}</Text>
                <Text>Interés: {selectedLoan.interes}%</Text>
                <Text>Estado: {selectedLoan.status}</Text>
                {selectedLoan.note && <Text>Nota: {selectedLoan.note}</Text>}

                {selectedLoan.remaining <= 0 ? (
                  <Text style={s.paidLabel}>Este préstamo ya está pagado</Text>
                ) : (
                  <>
                    <Text style={s.sectionLabel}>Monto a pagar:</Text>
                    <View style={s.inputBorder}>
                      <TextInput
                        value={paymentAmount}
                        onChangeText={setPaymentAmount}
                        placeholder="Ingresa el pago"
                        placeholderTextColor={Colors.placeholder}
                        keyboardType="numeric"
                      />
                    </View>

                    <Text style={s.sectionLabel}>Método de pago:</Text>
                    <View style={Styles.payToggle}>
                      <TouchableOpacity
                        style={[
                          Styles.paymentOption,
                          {
                            backgroundColor:
                              paymentMethod === "efectivo" ? Colors.paymentEfectivo : "#f0f0f0",
                          },
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setPaymentMethod("efectivo");
                        }}
                      >
                        <Text
                          style={{
                            color: paymentMethod === "efectivo" ? "white" : "black",
                            fontWeight: paymentMethod === "efectivo" ? "600" : "400",
                          }}
                        >
                          💵 Efectivo
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          Styles.paymentOption,
                          {
                            backgroundColor:
                              paymentMethod === "transferencia"
                                ? Colors.paymentTransferencia
                                : "#f0f0f0",
                          },
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setPaymentMethod("transferencia");
                        }}
                      >
                        <Text
                          style={{
                            color: paymentMethod === "transferencia" ? "white" : "black",
                            fontWeight: paymentMethod === "transferencia" ? "600" : "400",
                          }}
                        >
                          🏦 Transferencia
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={s.sectionLabel}>Nota del pago (opcional):</Text>
                    <View style={s.inputBorder}>
                      <TextInput
                        value={paymentNote}
                        onChangeText={setPaymentNote}
                        placeholder="Escribe una nota..."
                        placeholderTextColor={Colors.placeholder}
                        multiline
                      />
                    </View>

                    <Text style={s.remainingLabel}>
                      Restante después del pago:{" "}
                      <Text style={{ fontWeight: "bold" }}>
                        ${newRemaining !== null ? newRemaining : selectedLoan.remaining}
                      </Text>
                    </Text>

                    <TouchableOpacity
                      style={s.zeroPaymentBtn}
                      onPress={handleRegisterZeroPayment}
                      disabled={isProcessing}
                    >
                      <IconSymbol name="exclamationmark.triangle.fill" size={18} color="white" />
                      <Text style={s.btnWhiteText}>
                        {isProcessing ? "Procesando..." : "Registrar día sin pago"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={s.paymentBtn}
                      onPress={handleRegisterPayment}
                      disabled={isProcessing}
                    >
                      <Text style={s.btnWhiteText}>
                        {isProcessing ? "Procesando..." : "Registrar Pago"}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity
                  style={Styles.btnSecondary}
                  onPress={() => {
                    setModalVisible(false);
                    setPaymentAmount("");
                    setNewRemaining(null);
                    setPaymentNote("");
                    setPaymentMethod("efectivo");
                  }}
                >
                  <Text style={Styles.btnSecondaryText}>Cerrar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={paymentsModal} transparent animationType="fade">
        <View style={Styles.modalOverlay}>
          <View style={[Styles.modalContent, { height: "75%" }]}>
            <Text style={Styles.modalTitle}>Historial de Pagos</Text>

            <ScrollView style={{ marginTop: 10 }}>
              {payments.length === 0 ? (
                <Text style={s.emptyPayments}>No hay pagos registrados.</Text>
              ) : (
                (payments as Payment[]).map((p) => {
                  const isZeroPayment = p.amount === 0 || p.method === "sin_pago";
                  return (
                    <View
                      key={p.id}
                      style={[
                        s.paymentCard,
                        {
                          backgroundColor: isZeroPayment ? "#FFEBEE" : Colors.surface,
                          borderLeftColor: isZeroPayment
                            ? "#F44336"
                            : p.method === "efectivo"
                              ? Colors.paymentEfectivo
                              : Colors.paymentTransferencia,
                        },
                      ]}
                    >
                      <View style={s.paymentCardRow}>
                        <View>
                          <Text
                            style={[s.paymentAmount, { color: isZeroPayment ? "#D32F2F" : "#333" }]}
                          >
                            ${p.amount}
                          </Text>
                          <Text style={s.paymentDate}>
                            {new Date(p.created_at).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </Text>
                        </View>

                        <View
                          style={[
                            s.paymentBadge,
                            {
                              backgroundColor: isZeroPayment
                                ? "#FFCDD2"
                                : p.method === "efectivo"
                                  ? "#E8F5E9"
                                  : "#E3F2FD",
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: isZeroPayment
                                ? "#D32F2F"
                                : p.method === "efectivo"
                                  ? "#2E7D32"
                                  : "#1565C0",
                              fontWeight: "600",
                              fontSize: FontSize.xs,
                            }}
                          >
                            {isZeroPayment
                              ? "⏸️ Sin pago"
                              : p.method === "efectivo"
                                ? "💵 Efectivo"
                                : "🏦 Transferencia"}
                          </Text>
                        </View>
                      </View>

                      {p.note && (
                        <View
                          style={[
                            s.paymentNoteWrap,
                            { borderTopColor: isZeroPayment ? "#FFCDD2" : "#eee" },
                          ]}
                        >
                          <Text
                            style={[
                              s.paymentNote,
                              { color: isZeroPayment ? "#D32F2F" : Colors.textGray },
                            ]}
                          >
                            📝 {p.note}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity style={s.pdfBtn} onPress={generatePDF}>
              <IconSymbol name="square.and.arrow.up" size={18} color="white" />
              <Text style={s.btnWhiteText}>Descargar PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity style={Styles.btnSecondary} onPress={() => setPaymentsModal(false)}>
              <Text style={Styles.btnSecondaryText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomSheet
        ref={deleteSheetRef}
        index={-1}
        snapPoints={["25%"]}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: Colors.surface }}
      >
        <View style={s.sheetContent}>
          <IconSymbol name="exclamationmark.triangle.fill" size={32} color={Colors.delete} />
          <Text style={s.sheetTitle}>Eliminar Préstamo</Text>
          <Text style={s.sheetMessage}>
            ¿Estás seguro de que deseas eliminar este préstamo? Esta acción no se puede deshacer.
          </Text>
          <View style={s.sheetBtnRow}>
            <TouchableOpacity
              style={[s.sheetBtn, s.sheetBtnCancel]}
              onPress={() => deleteSheetRef.current?.close()}
            >
              <Text style={s.sheetBtnCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.sheetBtn, s.sheetBtnDanger]} onPress={confirmDelete}>
              <Text style={s.sheetBtnText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}

const s = StyleSheet.create({
  pageTitle: {
    fontSize: FontSize.titleLg,
    fontWeight: "bold",
    marginBottom: 10,
    color: Colors.text,
  },
  emptyText: { textAlign: "center", marginTop: 60, color: Colors.textMuted, fontSize: FontSize.lg },
  loanHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  loanName: { fontSize: FontSize.xl, fontWeight: "bold", color: Colors.text },
  deleteBtn: { padding: 6, borderRadius: Radius.sm, backgroundColor: Colors.deleteBg },
  loanDate: { fontSize: FontSize.md, color: Colors.textGray, marginTop: 2 },
  loanRow: { marginTop: 4, fontSize: FontSize.lg, color: Colors.text },
  loanNote: {
    marginTop: 10,
    fontStyle: "italic",
    color: Colors.textLightGray,
    fontSize: FontSize.md,
  },
  loanActions: { marginTop: 16, flexDirection: "row", justifyContent: "space-between" },
  paidLabel: {
    marginTop: Spacing.xxl,
    color: Colors.success,
    fontWeight: "bold",
    textAlign: "center",
  },
  sectionLabel: { marginTop: Spacing.xxl, fontWeight: "bold", color: Colors.text },
  inputBorder: {
    marginTop: 6,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: 8,
  },
  remainingLabel: { marginTop: 15, color: Colors.text },
  zeroPaymentBtn: {
    backgroundColor: "#FF9800",
    padding: 12,
    marginTop: 10,
    borderRadius: Radius.md,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  paymentBtn: {
    backgroundColor: Colors.paymentEfectivo,
    padding: 12,
    marginTop: 10,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  btnWhiteText: { color: Colors.surface, fontWeight: "bold" },
  emptyPayments: { textAlign: "center", color: Colors.textLightGray, marginTop: Spacing.xxl },
  paymentCard: {
    padding: 14,
    borderRadius: Radius.lg,
    marginBottom: 12,
    borderLeftWidth: 4,
    ...Shadow.sm,
  },
  paymentCardRow: { flexDirection: "row", justifyContent: "space-between" },
  paymentAmount: { fontSize: FontSize.xxl, fontWeight: "bold" },
  paymentDate: { fontSize: FontSize.xs, color: Colors.textLightGray, marginTop: 2 },
  paymentBadge: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  paymentNoteWrap: { marginTop: 10, paddingTop: 10, borderTopWidth: 1 },
  paymentNote: { fontSize: FontSize.sm, fontStyle: "italic" },
  pdfBtn: {
    backgroundColor: Colors.paymentTransferencia,
    padding: 12,
    marginTop: 15,
    borderRadius: Radius.md,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  sheetContent: { padding: Spacing.xl, alignItems: "center" },
  sheetTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "bold",
    color: Colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  sheetMessage: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  sheetBtnRow: { flexDirection: "row", gap: 12, width: "100%" },
  sheetBtn: { flex: 1, padding: 14, borderRadius: Radius.md, alignItems: "center" },
  sheetBtnCancel: { backgroundColor: Colors.greenBg },
  sheetBtnCancelText: { color: Colors.text, fontWeight: "600" },
  sheetBtnDanger: { backgroundColor: Colors.delete },
  sheetBtnText: { color: Colors.surface, fontWeight: "bold", fontSize: FontSize.md },
});
