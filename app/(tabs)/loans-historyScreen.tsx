import { IconSymbol } from "@/components/ui/icon-symbol";
import type { Session } from "@supabase/supabase-js";
import * as Print from 'expo-print';
import { useFocusEffect } from "expo-router";
import { shareAsync } from 'expo-sharing';
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
  method: string | null;
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
  // Store the loan associated with the current payments view for PDF generation
  const [historyLoan, setHistoryLoan] = useState<Loan | null>(null);

  // Campos del pago
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [newRemaining, setNewRemaining] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentNote, setPaymentNote] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("efectivo");


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

  // -------------------- GENERATE PDF --------------------
  const generatePDF = async () => {
    if (!historyLoan) {
      Alert.alert("Error", "No se encontró información del préstamo.");
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
            .status-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
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
              <tr>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Método</th>
                <th>Nota</th>
              </tr>
            </thead>
            <tbody>
              ${payments.map(p => {
      const isZeroPayment = p.amount === 0 || p.method === "sin_pago";
      const methodText = isZeroPayment ? "Sin pago" : (p.method === "efectivo" ? "Efectivo" : "Transferencia");
      return `
                  <tr style="background-color: ${isZeroPayment ? '#fff0f0' : '#fff'}">
                    <td>${new Date(p.created_at).toLocaleDateString()} ${new Date(p.created_at).toLocaleTimeString()}</td>
                    <td class="amount">$${p.amount}</td>
                    <td>${methodText}</td>
                    <td>${p.note || '-'}</td>
                  </tr>
                `;
    }).join('')}
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
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo generar el PDF");
    }
  };

  // -------------------- REGISTRAR PAGO --------------------
  const registerPayment = async () => {
    if (!selectedLoan) return;

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

    try {
      const { error } = await supabase.rpc("process_payment", {
        p_loan_id: selectedLoan.id,
        p_payer_id: selectedLoan.owner_id,
        p_amount: amount,
        p_note: paymentNote || null,
        p_method: paymentMethod, // Usar el método seleccionado
      });

      if (error) throw error;

      Alert.alert("Éxito", "Pago registrado correctamente.");

      loadLoans();
      setModalVisible(false);
      setPaymentAmount("");
      setNewRemaining(null);
      setPaymentMethod("efectivo"); // Resetear a valor por defecto
      setPaymentNote("");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo registrar el pago.");
    } finally {
      setProcessing(false);
    }
  };

  // -------------------- REGISTRAR PAGO EN 0 --------------------
  const registerZeroPayment = async () => {
    if (!selectedLoan) return;

    Alert.alert(
      "Registrar día sin pago",
      "¿Deseas registrar un día sin pago? Se creará un registro con monto 0.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Registrar",
          style: "default",
          onPress: async () => {
            setProcessing(true);

            // Crear nota con fecha actual
            const currentDate = new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            const zeroPaymentNote = `Día sin pago - ${currentDate}`;

            const { data, error } = await supabase.rpc("process_payment", {
              p_loan_id: selectedLoan.id,
              p_payer_id: selectedLoan.owner_id,
              p_amount: 0,
              p_note: zeroPaymentNote,
              p_method: "sin_pago",
            });

            setProcessing(false);

            if (error) {
              console.error(error);
              Alert.alert("Error", "No se pudo registrar el día sin pago.");
              return;
            }

            Alert.alert("Éxito", "Día sin pago registrado correctamente.");

            // Cerrar el modal de detalles
            setModalVisible(false);

            // Resetear valores
            setPaymentAmount("");
            setNewRemaining(null);
            setPaymentMethod("efectivo");
            setPaymentNote("");

            // Recargar préstamos
            loadLoans();
          },
        },
      ]
    );
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

    setHistoryLoan(loans.find(l => l.id === loanId) || null);
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
      <Text style={{ fontSize: 25, fontWeight: "bold", marginBottom: 10 }}>
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

                    {/* SELECTOR DE MÉTODO DE PAGO */}
                    <Text style={{ marginTop: 15, fontWeight: "bold" }}>Método de pago:</Text>
                    <View style={{ flexDirection: "row", marginTop: 8, gap: 10 }}>
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          padding: 12,
                          borderRadius: 8,
                          backgroundColor: paymentMethod === "efectivo" ? "#4CAF50" : "#f0f0f0",
                          alignItems: "center",
                        }}
                        onPress={() => setPaymentMethod("efectivo")}
                      >
                        <Text style={{
                          color: paymentMethod === "efectivo" ? "white" : "black",
                          fontWeight: paymentMethod === "efectivo" ? "600" : "400"
                        }}>
                          💵 Efectivo
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={{
                          flex: 1,
                          padding: 12,
                          borderRadius: 8,
                          backgroundColor: paymentMethod === "transferencia" ? "#4CAF50" : "#f0f0f0",
                          alignItems: "center",
                        }}
                        onPress={() => setPaymentMethod("transferencia")}
                      >
                        <Text style={{
                          color: paymentMethod === "transferencia" ? "white" : "black",
                          fontWeight: paymentMethod === "transferencia" ? "600" : "400"
                        }}>
                          🏦 Transferencia
                        </Text>
                      </TouchableOpacity>
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

                    {/* BOTÓN PARA REGISTRAR PAGO EN 0 */}
                    <TouchableOpacity
                      style={{
                        backgroundColor: "#FF9800",
                        padding: 12,
                        marginTop: 10,
                        borderRadius: 10,
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                        gap: 8,
                      }}
                      onPress={() => registerZeroPayment()}
                      disabled={processing}
                    >
                      <IconSymbol name="exclamationmark.triangle.fill" size={18} color="white" />
                      <Text style={{ color: "white", fontWeight: "bold" }}>
                        {processing ? "Procesando..." : "Registrar día sin pago"}
                      </Text>
                    </TouchableOpacity>

                    {/* BOTÓN PARA REGISTRAR PAGO NORMAL */}
                    <TouchableOpacity
                      style={{
                        backgroundColor: "#4CAF50",
                        padding: 12,
                        marginTop: 10,
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
                    setPaymentMethod("efectivo");
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
                <Text style={{ textAlign: "center", color: "#666", marginTop: 20 }}>
                  No hay pagos registrados.
                </Text>
              ) : (
                payments.map((p) => {
                  // Determinar si es un pago en 0 (día sin pago)
                  const isZeroPayment = p.amount === 0 || p.method === "sin_pago";

                  return (
                    <View
                      key={p.id}
                      style={{
                        padding: 14,
                        backgroundColor: isZeroPayment ? "#FFEBEE" : "white",
                        borderRadius: 12,
                        marginBottom: 12,
                        borderLeftWidth: 4,
                        borderLeftColor: isZeroPayment ? "#F44336" :
                          (p.method === "efectivo" ? "#4CAF50" : "#2196F3"),
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 2,
                      }}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <View>
                          <Text style={{
                            fontSize: 18,
                            fontWeight: "bold",
                            color: isZeroPayment ? "#D32F2F" : "#333"
                          }}>
                            ${p.amount}
                          </Text>
                          <Text style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                            {new Date(p.created_at).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </Text>
                        </View>

                        <View style={{
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: isZeroPayment ? "#FFCDD2" :
                            (p.method === "efectivo" ? "#E8F5E9" : "#E3F2FD"),
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 20,
                        }}>
                          <Text style={{
                            color: isZeroPayment ? "#D32F2F" :
                              (p.method === "efectivo" ? "#2E7D32" : "#1565C0"),
                            fontWeight: "600",
                            fontSize: 12,
                          }}>
                            {isZeroPayment ? "⏸️ Sin pago" :
                              (p.method === "efectivo" ? "💵 Efectivo" : "🏦 Transferencia")}
                          </Text>
                        </View>
                      </View>

                      {p.note && (
                        <View style={{
                          marginTop: 10,
                          paddingTop: 10,
                          borderTopWidth: 1,
                          borderTopColor: isZeroPayment ? "#FFCDD2" : "#eee"
                        }}>
                          <Text style={{
                            fontSize: 13,
                            color: isZeroPayment ? "#D32F2F" : "#555",
                            fontStyle: "italic"
                          }}>
                            📝 {p.note}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* BOTÓN DESCARGAR PDF */}
            <TouchableOpacity
              style={{
                backgroundColor: "#2196F3",
                padding: 12,
                marginTop: 15,
                borderRadius: 10,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
              onPress={generatePDF}
            >
              <IconSymbol name="square.and.arrow.up" size={18} color="white" />
              <Text style={{ color: "white", fontWeight: "bold" }}>Descargar PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: "#ddd",
                padding: 10,
                marginTop: 10,
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