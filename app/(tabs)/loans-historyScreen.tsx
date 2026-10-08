import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Print from "expo-print";
import { File, Paths } from "expo-file-system";
import { shareAsync } from "expo-sharing";
import * as Haptics from "expo-haptics";
import { useEffect, useState, useCallback } from "react";
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
import {
  useLoansQuery,
  useDeleteLoanMutation,
  useCreateLoanMutation,
  usePaymentsQuery,
  useRegisterPaymentMutation,
  useRegisterZeroPaymentMutation,
} from "@/hooks/useQueryLoans";
import type { Loan, Payment, PaymentMethod } from "@/types";
import { showSuccess, showError } from "@/lib/toast";
import { logger } from "@/lib/logger";
import { Colors, Styles, FontSize, Radius, Shadow, Spacing } from "@/constants/styles";
import { CardSkeleton } from "@/components/SkeletonLoader";
import { KeyboardSafeModalBody } from "@/components/KeyboardSafeModalBody";
import {
  getClientLoans,
  getLoanClientName,
  groupLoansByClient,
  normalizeClientName,
  type ClientGroup,
} from "@/lib/clients";
import { formatDate, formatMoney } from "@/lib/format";
import { AppIcon, type AppIconName } from "@/components/ui/app-icon";
import { IconLabel } from "@/components/ui/icon-label";
import { ClientHistoryModal } from "@/components/ClientHistoryModal";

export { Loan, Payment } from "@/types";

const ACTION_COLORS = {
  neutral: { bg: "#eef0f3", fg: "#1f2937" },
  blue: { bg: "#dbeafe", fg: "#1d4ed8" },
  green: { bg: "#dcfce7", fg: "#166534" },
  muted: { bg: "#f3f4f6", fg: "#6b7280" },
} as const;

function ActionButton({
  icon,
  label,
  variant,
  onPress,
}: {
  icon: AppIconName;
  label: string;
  variant: keyof typeof ACTION_COLORS;
  onPress?: () => void;
}) {
  const { bg, fg } = ACTION_COLORS[variant];
  return (
    <TouchableOpacity
      style={[s.actionBtn, { backgroundColor: bg }]}
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
    >
      <AppIcon name={icon} size={18} color={fg} />
      <Text style={[s.actionBtnText, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function LoansHistoryScreen() {
  const insets = useSafeAreaInsets();

  const loansQuery = useLoansQuery();
  const allLoans = loansQuery.data ?? [];
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"activos" | "pagados">("activos");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [historyClientId, setHistoryClientId] = useState<string | null>(null);
  const historyLoans = historyClientId ? getClientLoans(allLoans, historyClientId) : [];
  const query = normalizeClientName(search);
  const matchingLoans = query
    ? allLoans.filter((l) => normalizeClientName(getLoanClientName(l)).includes(query))
    : allLoans;
  const activeGroups = groupLoansByClient(matchingLoans.filter((l) => l.remaining > 0));
  const paidGroups = groupLoansByClient(matchingLoans.filter((l) => l.remaining <= 0));
  const clientGroups = tab === "activos" ? activeGroups : paidGroups;
  const otherTabCount = tab === "activos" ? paidGroups.length : activeGroups.length;
  const renewedIds = new Set(allLoans.map((l) => l.renewed_from).filter(Boolean));
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

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState<string | null>(null);

  const [renewModalVisible, setRenewModalVisible] = useState(false);
  const [loanToRenew, setLoanToRenew] = useState<Loan | null>(null);
  const [renewAmount, setRenewAmount] = useState("");
  const [renewInteres, setRenewInteres] = useState("");
  const [renewNote, setRenewNote] = useState("");

  const createLoanMutation = useCreateLoanMutation();

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
  const typedAmount = parseFloat(paymentAmount);
  const exceedsRemaining =
    !!selectedLoan && !isNaN(typedAmount) && typedAmount - selectedLoan.remaining > 0.005;

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
      const clientSlug = historyLoan.debtor_name.replace(/\s+/g, "_");
      const dateSlug = new Date().toLocaleDateString("es-ES").replace(/\//g, "-");
      const fileName = `Reporte_${clientSlug}_${dateSlug}`;
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      const namedFile = new File(Paths.cache, `${fileName}.pdf`);
      if (namedFile.exists) namedFile.delete();
      new File(uri).move(namedFile);
      await shareAsync(namedFile.uri, { UTI: "com.adobe.pdf", mimeType: "application/pdf" });
    } catch (error) {
      logger.error("PDF generation failed", error);
      showError("Error", "No se pudo generar el PDF");
    }
  };

  const handleDeleteLoan = useCallback((id: string) => {
    setLoanToDelete(id);
    setDeleteModalVisible(true);
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
    setDeleteModalVisible(false);
    setLoanToDelete(null);
  }, [loanToDelete, deleteLoanMutation]);

  const openPaymentsModal = (loanId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHistoryLoan(allLoans.find((l) => l.id === loanId) || null);
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
    if (amount - selectedLoan.remaining > 0.005) {
      showError(
        "Monto mayor al restante",
        `Solo se deben ${formatMoney(selectedLoan.remaining)}. Ingresa un monto menor o igual.`
      );
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

  const handleRenewLoan = () => {
    if (!loanToRenew) return;
    const amount = parseFloat(renewAmount);
    if (isNaN(amount) || amount <= 0) {
      showError("Error", "Ingresa un monto válido.");
      return;
    }
    const interes = Number(renewInteres);
    if (renewInteres.trim() === "" || isNaN(interes) || interes < 0 || interes > 100) {
      showError("Error", "El interés debe ser un número entre 0 y 100.");
      return;
    }
    createLoanMutation.mutate(
      {
        debtorName: loanToRenew.debtor_name,
        amount,
        interes,
        paymentMethod: loanToRenew.payment_method ?? "efectivo",
        note: renewNote || "",
        renewedFrom: loanToRenew.id,
      },
      {
        onSuccess: () => {
          showSuccess("Éxito", `Crédito renovado para ${getLoanClientName(loanToRenew)}.`);
          setTab("activos");
          setExpanded((prev) => ({ ...prev, [`activos:${loanToRenew.client_id}`]: true }));
          setRenewModalVisible(false);
          setLoanToRenew(null);
          setRenewAmount("");
          setRenewInteres("");
          setRenewNote("");
        },
        onError: (err) => {
          const message = (err as { message?: string } | null)?.message ?? "";
          const known = /ya fue renovado|aún no está pagado|no existe/.test(message);
          showError("Error", known ? message : "No se pudo renovar el crédito.");
        },
      }
    );
  };

  const renderLoanRow = (item: Loan) => {
    const alert = item.last_payment_was_zero;
    const fg = alert ? "#ffffff" : Colors.text;
    const subtle = alert ? "#ffffff" : Colors.textGray;

    return (
      <View key={item.id} style={[s.loanRowCard, alert && s.loanRowAlert]}>
        <View style={s.loanHeader}>
          <Text style={[s.loanName, alert && s.textOnAlert]}>
            Crédito del {formatDate(item.created_at)}
          </Text>
          <TouchableOpacity
            onPress={() => handleDeleteLoan(item.id)}
            style={s.deleteBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol name="trash.fill" size={18} color="#a00" />
          </TouchableOpacity>
        </View>

        {alert && (
          <View style={s.alertLabel}>
            <AppIcon name="warning" size={14} color="#ffffff" />
            <Text style={s.alertLabelText}>DÍA SIN PAGO</Text>
          </View>
        )}

        <IconLabel icon="payments" color={fg} style={s.infoRow} textStyle={s.infoText}>
          Restante: <Text style={s.bold}>{formatMoney(item.remaining)}</Text>
        </IconLabel>
        <IconLabel icon="trending-up" color={fg} style={s.infoRow} textStyle={s.infoText}>
          Interés: <Text style={s.bold}>{item.interes}%</Text>
        </IconLabel>

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

        {item.renewal_number > 0 && (
          <TouchableOpacity
            style={s.renewalTag}
            activeOpacity={0.7}
            onPress={() => setHistoryClientId(item.client_id)}
          >
            <AppIcon name="autorenew" size={15} color="#1d4ed8" />
            <Text style={s.renewalTagText}>Renovación #{item.renewal_number}</Text>
            <AppIcon name="chevron-right" size={16} color="#1d4ed8" />
          </TouchableOpacity>
        )}

        {item.note ? (
          <IconLabel icon="notes" color={subtle} style={s.noteRow} textStyle={s.noteText}>
            {item.note}
          </IconLabel>
        ) : null}

        <View style={s.loanActions}>
          {item.remaining > 0 ? (
            <ActionButton
              icon="payments"
              label="Registrar pago"
              variant="neutral"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setSelectedLoan(item);
                setModalVisible(true);
                setPaymentAmount("");
                setNewRemaining(item.remaining);
              }}
            />
          ) : renewedIds.has(item.id) ? (
            <ActionButton icon="check-circle" label="Renovado" variant="muted" />
          ) : (
            <ActionButton
              icon="autorenew"
              label="Renovar crédito"
              variant="green"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setLoanToRenew(item);
                setRenewAmount("");
                setRenewInteres(String(item.interes));
                setRenewNote("");
                setRenewModalVisible(true);
              }}
            />
          )}

          <ActionButton
            icon="receipt-long"
            label="Ver pagos"
            variant="blue"
            onPress={() => openPaymentsModal(item.id)}
          />
        </View>
      </View>
    );
  };

  const renderClient = ({ item: group }: { item: ClientGroup }) => {
    const key = `${tab}:${group.clientId}`;
    const isOpen = expanded[key] ?? (group.loans.length === 1 || query.length > 0);
    const alert = group.hasAlert;
    const count = group.loans.length;
    const totalCredits = allLoans.filter((l) => l.client_id === group.clientId).length;
    const summary =
      tab === "activos"
        ? `${count} ${count === 1 ? "crédito activo" : "créditos activos"} · Restante $${group.totalRemaining}`
        : `${count} ${count === 1 ? "crédito pagado" : "créditos pagados"}`;

    return (
      <View style={[Styles.card, alert && s.cardAlert]}>
        <TouchableOpacity
          style={s.clientHeader}
          activeOpacity={0.7}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setExpanded((prev) => ({ ...prev, [key]: !isOpen }));
          }}
        >
          <View style={[s.clientAvatar, alert && s.clientAvatarAlert]}>
            <Text style={[s.clientAvatarText, alert && { color: "#dc2626" }]}>
              {group.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.clientName, alert && s.textOnAlert]} numberOfLines={1}>
              {group.name}
            </Text>
            <Text style={[s.clientSummary, alert && s.textOnAlert]}>{summary}</Text>
          </View>
          {totalCredits > 1 && (
            <TouchableOpacity
              style={[s.historyIconBtn, alert && s.historyIconBtnAlert]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setHistoryClientId(group.clientId);
              }}
            >
              <AppIcon name="history" size={20} color={alert ? "#ffffff" : Colors.primary} />
            </TouchableOpacity>
          )}
          <AppIcon
            name={isOpen ? "expand-less" : "expand-more"}
            size={26}
            color={alert ? "#ffffff" : Colors.textSecondary}
          />
        </TouchableOpacity>

        {isOpen && <View>{group.loans.map(renderLoanRow)}</View>}
      </View>
    );
  };

  return (
    <View style={[Styles.safeTop, { paddingTop: insets.top + 10 }]}>
      <Text style={s.pageTitle}>Préstamos</Text>

      <View style={s.searchWrap}>
        <AppIcon name="search" size={22} color={Colors.textMuted} />
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre..."
          placeholderTextColor={Colors.placeholder}
          autoCorrect={false}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity
            style={s.searchClear}
            onPress={() => setSearch("")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <AppIcon name="close" size={22} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={s.tabsRow}>
        {(
          [
            { key: "activos", label: "Activos", count: activeGroups.length },
            { key: "pagados", label: "Pagados", count: paidGroups.length },
          ] as const
        ).map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[s.tabBtn, tab === t.key && s.tabBtnActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setTab(t.key);
            }}
          >
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>
              {t.label} ({t.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : (
        <FlatList
          data={clientGroups}
          extraData={expanded}
          keyExtractor={(group) => group.clientId}
          renderItem={renderClient}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <Text style={s.emptyText}>
              {query
                ? otherTabCount > 0
                  ? `Sin resultados aquí. Hay ${otherTabCount} en ${tab === "activos" ? "Pagados" : "Activos"}.`
                  : "No se encontraron préstamos con ese nombre"
                : tab === "activos"
                  ? "No hay préstamos activos"
                  : "No hay préstamos pagados"}
            </Text>
          }
        />
      )}

      <Modal visible={modalVisible} transparent animationType="fade">
        <KeyboardSafeModalBody>
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
                      <View style={s.methodContent}>
                        <AppIcon
                          name="payments"
                          size={18}
                          color={paymentMethod === "efectivo" ? "white" : "black"}
                        />
                        <Text
                          style={{
                            color: paymentMethod === "efectivo" ? "white" : "black",
                            fontWeight: paymentMethod === "efectivo" ? "600" : "400",
                          }}
                        >
                          Efectivo
                        </Text>
                      </View>
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
                      <View style={s.methodContent}>
                        <AppIcon
                          name="account-balance"
                          size={18}
                          color={paymentMethod === "transferencia" ? "white" : "black"}
                        />
                        <Text
                          style={{
                            color: paymentMethod === "transferencia" ? "white" : "black",
                            fontWeight: paymentMethod === "transferencia" ? "600" : "400",
                          }}
                        >
                          Transferencia
                        </Text>
                      </View>
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

                  {exceedsRemaining ? (
                    <IconLabel
                      icon="error-outline"
                      color={Colors.delete}
                      style={s.overpayHint}
                      textStyle={s.overpayHintText}
                    >
                      El monto supera lo que se debe ({formatMoney(selectedLoan.remaining)}).
                    </IconLabel>
                  ) : (
                    <Text style={s.remainingLabel}>
                      Restante después del pago:{" "}
                      <Text style={{ fontWeight: "bold" }}>
                        {formatMoney(newRemaining !== null ? newRemaining : selectedLoan.remaining)}
                      </Text>
                    </Text>
                  )}

                  <TouchableOpacity
                    style={[
                      s.zeroPaymentBtn,
                      (paymentAmount.trim().length > 0 || isProcessing) && { opacity: 0.4 },
                    ]}
                    onPress={handleRegisterZeroPayment}
                    disabled={paymentAmount.trim().length > 0 || isProcessing}
                  >
                    <IconSymbol name="exclamationmark.triangle.fill" size={18} color="white" />
                    <Text style={s.btnWhiteText}>
                      {isProcessing ? "Procesando..." : "Registrar día sin pago"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.paymentBtn, exceedsRemaining && { opacity: 0.4 }]}
                    onPress={handleRegisterPayment}
                    disabled={isProcessing || exceedsRemaining}
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
        </KeyboardSafeModalBody>
      </Modal>

      <Modal visible={paymentsModal} transparent animationType="fade">
        <View style={Styles.modalOverlay}>
          <View style={[Styles.modalContent, { height: "75%" }]}>
            <Text style={Styles.modalTitle}>Historial de Pagos</Text>

            <ScrollView style={{ marginTop: 10 }}>
              {paymentsQuery.isLoading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
              ) : payments.length === 0 ? (
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
                          <View style={s.methodContent}>
                            <AppIcon
                              name={
                                isZeroPayment
                                  ? "pause-circle-outline"
                                  : p.method === "efectivo"
                                    ? "payments"
                                    : "account-balance"
                              }
                              size={14}
                              color={
                                isZeroPayment
                                  ? "#D32F2F"
                                  : p.method === "efectivo"
                                    ? "#2E7D32"
                                    : "#1565C0"
                              }
                            />
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
                                ? "Sin pago"
                                : p.method === "efectivo"
                                  ? "Efectivo"
                                  : "Transferencia"}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {p.note && (
                        <View
                          style={[
                            s.paymentNoteWrap,
                            { borderTopColor: isZeroPayment ? "#FFCDD2" : "#eee" },
                          ]}
                        >
                          <IconLabel
                            icon="notes"
                            size={16}
                            color={isZeroPayment ? "#D32F2F" : Colors.textGray}
                            textStyle={s.paymentNote}
                          >
                            {p.note}
                          </IconLabel>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity
              style={[
                s.pdfBtn,
                (paymentsQuery.isLoading || payments.length === 0) && { opacity: 0.4 },
              ]}
              onPress={generatePDF}
              disabled={paymentsQuery.isLoading || payments.length === 0}
            >
              <IconSymbol name="square.and.arrow.up" size={18} color="white" />
              <Text style={s.btnWhiteText}>Descargar PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity style={Styles.btnSecondary} onPress={() => setPaymentsModal(false)}>
              <Text style={Styles.btnSecondaryText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ClientHistoryModal
        visible={historyClientId !== null && historyLoans.length > 0}
        clientName={historyLoans[0] ? getLoanClientName(historyLoans[0]) : ""}
        loans={historyLoans}
        onClose={() => setHistoryClientId(null)}
        onViewPayments={(loan) => {
          setHistoryClientId(null);
          setTimeout(() => openPaymentsModal(loan.id), 300);
        }}
      />

      <Modal visible={renewModalVisible} transparent animationType="fade">
        <KeyboardSafeModalBody>
          {loanToRenew && (
            <>
              <Text style={Styles.modalTitle}>Renovar Crédito</Text>

              <View style={s.renewInfoBox}>
                <IconLabel icon="person" color={Colors.textSecondary} textStyle={s.renewInfoText}>
                  {getLoanClientName(loanToRenew)}
                </IconLabel>
                <IconLabel
                  icon="credit-card"
                  color={Colors.textSecondary}
                  textStyle={s.renewInfoText}
                >
                  Método: {loanToRenew.payment_method === "efectivo" ? "Efectivo" : "Transferencia"}
                </IconLabel>
              </View>

              <Text style={s.sectionLabel}>Nuevo monto:</Text>
              <View style={s.inputBorder}>
                <TextInput
                  value={renewAmount}
                  onChangeText={setRenewAmount}
                  placeholder="Ej: 200.00"
                  placeholderTextColor={Colors.placeholder}
                  keyboardType="numeric"
                />
              </View>

              <Text style={s.sectionLabel}>Interés (%):</Text>
              <View style={s.inputBorder}>
                <TextInput
                  value={renewInteres}
                  onChangeText={setRenewInteres}
                  placeholder="Ej: 10"
                  placeholderTextColor={Colors.placeholder}
                  keyboardType="numeric"
                />
              </View>

              <Text style={s.sectionLabel}>Nota (opcional):</Text>
              <View style={s.inputBorder}>
                <TextInput
                  value={renewNote}
                  onChangeText={setRenewNote}
                  placeholder="Escribe una nota..."
                  placeholderTextColor={Colors.placeholder}
                  multiline
                />
              </View>

              <TouchableOpacity
                style={[s.paymentBtn, createLoanMutation.isPending && { opacity: 0.6 }]}
                onPress={handleRenewLoan}
                disabled={createLoanMutation.isPending}
              >
                {createLoanMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.btnWhiteText}>Registrar nuevo crédito</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={Styles.btnSecondary}
                onPress={() => {
                  setRenewModalVisible(false);
                  setLoanToRenew(null);
                  setRenewAmount("");
                  setRenewInteres("");
                  setRenewNote("");
                }}
              >
                <Text style={Styles.btnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
            </>
          )}
        </KeyboardSafeModalBody>
      </Modal>

      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={Styles.modalOverlay}>
          <View style={[Styles.modalContent, { alignItems: "center" }]}>
            <IconSymbol name="exclamationmark.triangle.fill" size={36} color={Colors.delete} />
            <Text style={[Styles.modalTitle, { marginTop: 12 }]}>Eliminar Préstamo</Text>
            <Text style={s.sheetMessage}>
              ¿Estás seguro de que deseas eliminar este préstamo? Esta acción no se puede deshacer.
            </Text>
            <View style={s.sheetBtnRow}>
              <TouchableOpacity
                style={[s.sheetBtn, s.sheetBtnCancel]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setLoanToDelete(null);
                }}
              >
                <Text style={s.sheetBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.sheetBtn, s.sheetBtnDanger]} onPress={confirmDelete}>
                <Text style={s.sheetBtnText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  infoRow: { marginTop: 6 },
  infoText: { fontSize: FontSize.lg },
  bold: { fontWeight: "bold" },
  noteRow: { marginTop: 10 },
  noteText: { fontStyle: "italic", fontSize: FontSize.md },
  loanActions: { marginTop: 16, flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: Radius.md,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionBtnText: { fontSize: FontSize.md, fontWeight: "700" },
  methodContent: { flexDirection: "row", alignItems: "center", gap: 6 },
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
  overpayHint: { marginTop: 15 },
  overpayHintText: { fontWeight: "600" },
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
  cardAlert: {
    backgroundColor: "#dc2626",
    borderWidth: 2,
    borderColor: "#991b1b",
  },
  textOnAlert: { color: "#ffffff" },
  loanRowCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fafafa",
  },
  loanRowAlert: { backgroundColor: "#b91c1c", borderColor: "#7f1d1d" },
  clientHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primaryBg,
  },
  clientAvatarAlert: { backgroundColor: "#ffffff" },
  clientAvatarText: { fontSize: FontSize.xl, fontWeight: "bold", color: Colors.primary },
  clientName: { fontSize: FontSize.xl, fontWeight: "bold", color: Colors.text },
  clientSummary: { marginTop: 2, fontSize: FontSize.md, color: Colors.textGray },
  tabsRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignItems: "center",
    backgroundColor: "#e5e7eb",
  },
  tabBtnActive: { backgroundColor: Colors.primary },
  tabText: { fontWeight: "600", color: Colors.textSecondary },
  tabTextActive: { color: "#ffffff" },
  renewalTag: {
    marginTop: 8,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#dbeafe",
    paddingLeft: 8,
    paddingRight: 4,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  renewalTagText: { color: "#1d4ed8", fontWeight: "700", fontSize: FontSize.sm },
  alertLabel: {
    marginTop: 6,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#7f1d1d",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  alertLabelText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: FontSize.sm,
    letterSpacing: 0.5,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: FontSize.lg, color: Colors.text },
  searchClear: { paddingVertical: 6 },
  historyIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primaryBg,
  },
  historyIconBtnAlert: { backgroundColor: "rgba(255,255,255,0.22)" },
  renewInfoBox: {
    width: "100%",
    backgroundColor: "#f1f5f9",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: 8,
    gap: 4,
  },
  renewInfoText: { color: Colors.textSecondary, fontSize: FontSize.sm },
});
