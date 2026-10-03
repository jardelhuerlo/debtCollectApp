import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppIcon } from "@/components/ui/app-icon";
import { Colors, FontSize, Radius, Spacing, Styles } from "@/constants/styles";
import { getClientTotals, getLoanPaid, getLoanTotal, getPreviousLoan } from "@/lib/clients";
import { formatDate, formatMoney } from "@/lib/format";
import type { Loan } from "@/types";

interface Props {
  visible: boolean;
  clientName: string;
  loans: Loan[];
  onClose: () => void;
  onViewPayments: (loan: Loan) => void;
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={[s.rowValue, bold && s.rowValueBold]}>{value}</Text>
    </View>
  );
}

export function ClientHistoryModal({ visible, clientName, loans, onClose, onViewPayments }: Props) {
  const totals = getClientTotals(loans);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={Styles.modalOverlay}>
        <View style={[Styles.modalContent, s.content]}>
          <Text style={Styles.modalTitle} numberOfLines={1}>
            Historial de {clientName}
          </Text>

          <View style={s.summary}>
            <View style={s.summaryItem}>
              <Text style={s.summaryValue}>{formatMoney(totals.lent)}</Text>
              <Text style={s.summaryLabel}>Prestado</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={[s.summaryValue, { color: Colors.success }]}>
                {formatMoney(totals.paid)}
              </Text>
              <Text style={s.summaryLabel}>Pagado</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={s.summaryValue}>{formatMoney(totals.remaining)}</Text>
              <Text style={s.summaryLabel}>Restante</Text>
            </View>
          </View>

          <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
            {loans.map((loan) => {
              const isPaid = loan.remaining <= 0;
              const previous = getPreviousLoan(loan, loans);
              return (
                <View key={loan.id} style={s.card}>
                  <View style={s.cardHeader}>
                    <Text style={s.cardTitle}>Crédito del {formatDate(loan.created_at)}</Text>
                    <View style={[s.chip, isPaid ? s.chipPaid : s.chipActive]}>
                      <Text style={[s.chipText, isPaid ? s.chipPaidText : s.chipActiveText]}>
                        {isPaid ? "Pagado" : "Activo"}
                      </Text>
                    </View>
                  </View>

                  {loan.renewal_number > 0 && (
                    <View style={s.renewalRow}>
                      <AppIcon name="autorenew" size={16} color="#1d4ed8" />
                      <Text style={s.renewalText}>
                        Renovación #{loan.renewal_number}
                        {previous
                          ? ` · del crédito de ${formatMoney(previous.original_amount)} (${formatDate(previous.created_at)})`
                          : ""}
                      </Text>
                    </View>
                  )}

                  <Row label="Monto prestado" value={formatMoney(loan.original_amount)} />
                  <Row label="Interés" value={`${loan.interes}%`} />
                  <Row label="Total con interés" value={formatMoney(getLoanTotal(loan))} />
                  <Row label="Pagado" value={formatMoney(getLoanPaid(loan))} />
                  <Row label="Restante" value={formatMoney(loan.remaining)} bold />

                  {loan.note ? (
                    <View style={s.noteRow}>
                      <AppIcon name="notes" size={16} color={Colors.textGray} />
                      <Text style={s.noteText}>{loan.note}</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity style={s.paymentsBtn} onPress={() => onViewPayments(loan)}>
                    <AppIcon name="receipt-long" size={18} color={Colors.primary} />
                    <Text style={s.paymentsBtnText}>Ver pagos</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={Styles.btnSecondary} onPress={onClose}>
            <Text style={Styles.btnSecondaryText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  content: { maxHeight: "88%" },
  summary: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    marginTop: 4,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: { fontSize: FontSize.xl, fontWeight: "bold", color: Colors.text },
  summaryLabel: { fontSize: FontSize.sm, color: Colors.textGray, marginTop: 2 },
  list: { marginTop: 12, flexGrow: 0 },
  card: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fafafa",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: FontSize.lg, fontWeight: "bold", color: Colors.text, flexShrink: 1 },
  chip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.sm },
  chipActive: { backgroundColor: "#fef3c7" },
  chipPaid: { backgroundColor: "#dcfce7" },
  chipText: { fontSize: FontSize.sm, fontWeight: "700" },
  chipActiveText: { color: "#92400e" },
  chipPaidText: { color: "#166534" },
  renewalRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  renewalText: { flexShrink: 1, color: "#1d4ed8", fontSize: FontSize.sm, fontWeight: "600" },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  rowLabel: { color: Colors.textGray, fontSize: FontSize.md },
  rowValue: { color: Colors.text, fontSize: FontSize.md },
  rowValueBold: { fontWeight: "bold" },
  noteRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  noteText: { flexShrink: 1, fontStyle: "italic", color: Colors.textGray, fontSize: FontSize.md },
  paymentsBtn: {
    marginTop: 12,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: "#dbeafe",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  paymentsBtnText: { color: Colors.primary, fontWeight: "700", fontSize: FontSize.md },
});
