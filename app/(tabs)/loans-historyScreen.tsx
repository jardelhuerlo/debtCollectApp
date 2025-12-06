// ❗ Solo agregué —trash.fill— al mapping de IconSymbol
// Ve a tu archivo icon-symbol.tsx y agrega esta línea al MAPPING:
//
// "trash.fill": "delete",
//
// Ya con eso tu icono funciona perfecto.

import { IconSymbol } from "@/components/ui/icon-symbol";
import type { Session } from "@supabase/supabase-js";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

// TIPADO DE LOANS
export interface Loan {
  id: string;
  owner_id: string;
  debtor_name: string;
  original_amount: number;
  remaining: number;
  status: string;
  payment_method: string | null;
  note: string | null;
  interes: number;
  created_at: string;
}

// TIPADO DE PAYMENTS
interface Payment {
  id: string;
  loan_id: string;
  payer_id: string;
  amount: number;
  note: string | null;
  created_at: string;
}

export default function LoansHistoryScreen() {
  const insets = useSafeAreaInsets();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal de detalles
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Modal de pagos
  const [paymentsModal, setPaymentsModal] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Campos del pago
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [newRemaining, setNewRemaining] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentNote, setPaymentNote] = useState<string>("");


  // -------------------- LOAD LOANS --------------------
  const loadLoans = async () => {
    // Only show full loading spinner if not refreshing (to avoid double spinners)
    if (!refreshing) setLoading(true);

    const {
      data: { session },
    }: { data: { session: Session | null } } = await supabase.auth.getSession();

    if (!session) {
      console.warn("No hay sesión activa");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("loans")
      .select("*")
      .eq("owner_id", session.user.id)
      .order("created_at", { ascending: false });

    if (!error && data) setLoans(data as Loan[]);
    else console.error("Error cargando préstamos:", error);

    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadLoans();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLoans();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (!selectedLoan) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount)) {
      setNewRemaining(selectedLoan.remaining);
    } else {
      setNewRemaining(selectedLoan.remaining - amount);
    }
  }, [paymentAmount, selectedLoan]);

  // -------------------- REGISTRAR PAGO --------------------
  const registerPayment = async () => {
    if (!selectedLoan) return;
    setPaymentNote(""); ////
    // ❗ EVITAR PAGAR SI YA ESTÁ EN 0
    if (selectedLoan.remaining <= 0) {
      Alert.alert("Completado", "Este préstamo ya está completamente pagado.");
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Ingresa un monto válido.");
      return;
    }

    setProcessing(true);

    const { data, error } = await supabase.rpc("process_payment", {
      p_loan_id: selectedLoan.id,
      p_payer_id: selectedLoan.owner_id,
      p_amount: amount,
      p_note: paymentNote || null,
    });

    setProcessing(false);

    if (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo registrar el pago.");
      return;
    }

    // ❗ IMPORTANTE → si el pago deja remaining = 0, marcar como "pagado"
    if (data?.updated_remaining === 0) {
      await supabase
        .from("loans")
        .update({ status: "pagado" })
        .eq("id", selectedLoan.id);
    }

    Alert.alert("Éxito", "Pago registrado correctamente.");

    loadLoans();
    setModalVisible(false);
    setPaymentAmount("");
    setNewRemaining(null);
  };

  // -------------------- ELIMINAR --------------------
  const deleteLoan = async (id: string) => {
    Alert.alert(
      "Eliminar préstamo",
      "¿Seguro que deseas eliminar este préstamo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.from("loans").delete().eq("id", id);
            if (error) Alert.alert("Error", "No se pudo eliminar");
            else setLoans((prev) => prev.filter((l) => l.id !== id));
          },
        },
      ]
    );
  };

  // -------------------- CARGAR PAGOS --------------------
  const openPaymentsModal = async (loanId: string) => {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("loan_id", loanId)
      .order("created_at", { ascending: false });

    if (error) {
      Alert.alert("Error", "No se pudieron cargar los pagos");
      return;
    }

    setPayments(data as Payment[]);
    setPaymentsModal(true);
  };

  // -------------------- CARD DE PRÉSTAMO --------------------
  const renderLoan = ({ item }: { item: Loan }) => (
    <View
      style={{
        backgroundColor: "#fff",
        marginVertical: 10,
        padding: 16,
        borderRadius: 12,
        elevation: 3,
      }}
    >
      {/* FILA SUPERIOR: NOMBRE + ELIMINAR */}
      <View
        style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
      >
        <Text style={{ fontSize: 17, fontWeight: "bold" }}>{item.debtor_name}</Text>

        <TouchableOpacity
          onPress={() => deleteLoan(item.id)}
          style={{
            padding: 6,
            borderRadius: 8,
            backgroundColor: "#ffe5e5",
          }}
        >
          <IconSymbol name="trash.fill" size={18} color="#a00" />
        </TouchableOpacity>
      </View>

      <Text style={{ fontSize: 14, color: "#555" }}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>

      <Text style={{ marginTop: 8, fontSize: 15 }}>
        💰 Restante: <Text style={{ fontWeight: "bold" }}>${item.remaining}</Text>
      </Text>

      <Text style={{ marginTop: 4, fontSize: 15 }}>
        📈 Interés: <Text style={{ fontWeight: "bold" }}>{item.interes}%</Text>
      </Text>

      <View
        style={{
          marginTop: 8,
          alignSelf: "flex-start",
          backgroundColor: item.status === "pendiente" ? "#ffe9a8" : "#c8f7c5",
          paddingVertical: 4,
          paddingHorizontal: 10,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "#333", fontWeight: "500" }}>{item.status}</Text>
      </View>

      {item.note && (
        <Text
          style={{
            marginTop: 10,
            fontStyle: "italic",
            color: "#666",
            fontSize: 14,
          }}
        >
          📝 {item.note}
        </Text>
      )}

      {/* BOTONES ABAJO */}
      <View
        style={{
          marginTop: 16,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        {/* DETALLES */}
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "#eee",
            padding: 10,
            borderRadius: 10,
            marginRight: 6,
            alignItems: "center",
          }}
          onPress={() => {
            setSelectedLoan(item);
            setModalVisible(true);
            setPaymentAmount("");
            setNewRemaining(item.remaining);
          }}
        >
          <Text>Registrar Pago</Text>
        </TouchableOpacity>

        {/* VER PAGOS */}
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "#d0e6ff",
            padding: 10,
            borderRadius: 10,
            marginLeft: 6,
            alignItems: "center",
          }}
          onPress={() => openPaymentsModal(item.id)}
        >
          <Text style={{ fontWeight: "600" }}>Ver Pagos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top + 10,
        paddingHorizontal: 16,
        backgroundColor: "#f5f5f5",
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
        Préstamos
      </Text>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(item) => item.id}
          renderItem={renderLoan}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* -------------------- MODAL DETALLES -------------------- */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              padding: 20,
              width: "100%",
              borderRadius: 12,
            }}
          >
            {selectedLoan && (
              <>
                <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
                  Detalles del Préstamo
                </Text>

                <Text>Cliente: {selectedLoan.debtor_name}</Text>
                <Text>Monto Original: ${selectedLoan.original_amount}</Text>
                <Text>Restante: ${selectedLoan.remaining}</Text>
                <Text>Interés: {selectedLoan.interes}%</Text>
                <Text>Estado: {selectedLoan.status}</Text>
                {selectedLoan.note && <Text>Nota: {selectedLoan.note}</Text>}

                {/* ❗ Si el prestamo ya está pagado, no permitir pagar */}
                {selectedLoan.remaining <= 0 ? (
                  <Text
                    style={{
                      marginTop: 20,
                      color: "green",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    Este préstamo ya está pagado
                  </Text>
                ) : (
                  <>
                    <Text style={{ marginTop: 20, fontWeight: "bold" }}>Monto a pagar:</Text>

                    <View
                      style={{
                        marginTop: 6,
                        borderColor: "#ccc",
                        borderWidth: 1,
                        borderRadius: 8,
                        padding: 8,
                      }}
                    >
                      <TextInput
                        value={paymentAmount}
                        onChangeText={setPaymentAmount}
                        placeholder="Ingresa el pago"
                        keyboardType="numeric"
                      />
                    </View>
                    <Text style={{ marginTop: 20, fontWeight: "bold" }}>Nota del pago (opcional):</Text>

                    <View
                      style={{
                        marginTop: 6,
                        borderColor: "#ccc",
                        borderWidth: 1,
                        borderRadius: 8,
                        padding: 8,
                      }}
                    >
                      <TextInput
                        value={paymentNote}
                        onChangeText={setPaymentNote}
                        placeholder="Escribe una nota..."
                        multiline
                      />
                    </View>

                    <Text style={{ marginTop: 15 }}>
                      Restante después del pago:{" "}
                      <Text style={{ fontWeight: "bold" }}>
                        ${newRemaining !== null ? newRemaining : selectedLoan.remaining}
                      </Text>
                    </Text>

                    <TouchableOpacity
                      style={{
                        backgroundColor: "#4CAF50",
                        padding: 12,
                        marginTop: 20,
                        borderRadius: 10,
                        alignItems: "center",
                      }}
                      onPress={registerPayment}
                      disabled={processing}
                    >
                      <Text style={{ color: "white", fontWeight: "bold" }}>
                        {processing ? "Procesando..." : "Registrar Pago"}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity
                  style={{
                    backgroundColor: "#ddd",
                    padding: 10,
                    marginTop: 10,
                    borderRadius: 10,
                    alignItems: "center",
                  }}
                  onPress={() => {
                    setModalVisible(false);
                    setPaymentAmount("");
                    setNewRemaining(null);
                    setPaymentNote("");
                  }}
                >
                  <Text>Cerrar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* -------------------- MODAL PAGOS -------------------- */}
      <Modal visible={paymentsModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              padding: 20,
              width: "100%",
              height: "75%",
              borderRadius: 12,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
              Historial de Pagos
            </Text>

            <ScrollView style={{ marginTop: 10 }}>
              {payments.length === 0 ? (
                <Text>No hay pagos registrados.</Text>
              ) : (
                payments.map((p) => (
                  <View
                    key={p.id}
                    style={{
                      padding: 12,
                      backgroundColor: "#eef6ff",
                      borderRadius: 10,
                      marginBottom: 10,
                    }}
                  >
                    <Text style={{ fontWeight: "bold" }}>${p.amount}</Text>
                    {p.note && <Text style={{ marginTop: 3 }}>📝 {p.note}</Text>}
                    <Text style={{ marginTop: 3, color: "#555" }}>
                      {new Date(p.created_at).toLocaleString()}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={{
                backgroundColor: "#ddd",
                padding: 10,
                marginTop: 15,
                borderRadius: 10,
                alignItems: "center",
              }}
              onPress={() => setPaymentsModal(false)}
            >
              <Text>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
