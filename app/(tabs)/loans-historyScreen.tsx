import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

// --- TIPADO REAL DE TU TABLA LOANS ---
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

export default function LoansHistoryScreen() {
  const insets = useSafeAreaInsets();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    setLoading(true);

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

    if (!error && data) {
      setLoans(data as Loan[]);
    } else {
      console.error("Error cargando préstamos:", error);
    }

    setLoading(false);
  };

  // --- ELIMINAR ---
  const deleteLoan = async (id: string) => {
    Alert.alert(
      "Eliminar préstamo",
      "¿Estás seguro que quieres eliminar este registro?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.from("loans").delete().eq("id", id);
            if (error) {
              Alert.alert("Error", "No se pudo eliminar");
            } else {
              setLoans((prev) => prev.filter((loan) => loan.id !== id));
            }
          },
        },
      ]
    );
  };

  // --- CARD DE PRÉSTAMO ---
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
      {/* NOMBRE DEL DEUDOR */}
      <Text style={{ fontSize: 17, fontWeight: "bold", marginBottom: 4 }}>
        {item.debtor_name}
      </Text>

      {/* FECHA */}
      <Text style={{ fontSize: 14, color: "#555" }}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>

      {/* MONTO RESTANTE */}
      <Text style={{ marginTop: 8, fontSize: 15 }}>
        💰 Restante:{" "}
        <Text style={{ fontWeight: "bold" }}>${item.remaining}</Text>
      </Text>

      {/* INTERÉS */}
      <Text style={{ marginTop: 4, fontSize: 15 }}>
        📈 Interés: <Text style={{ fontWeight: "bold" }}>{item.interes}%</Text>
      </Text>

      {/* ESTADO */}
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

      {/* NOTA */}
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

      {/* BOTONES */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 16,
        }}
      >
        {/* Detalles */}
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
          }}
        >
          <Text>Detalles</Text>
        </TouchableOpacity>

        {/* Eliminar */}
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "#ffdddd",
            padding: 10,
            borderRadius: 10,
            marginLeft: 6,
            alignItems: "center",
          }}
          onPress={() => deleteLoan(item.id)}
        >
          <Text style={{ color: "red", fontWeight: "bold" }}>Eliminar</Text>
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
        Historial de Préstamos
      </Text>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(item) => item.id}
          renderItem={renderLoan}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* --- MODAL DE DETALLES --- */}
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
                <Text
                  style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}
                >
                  Detalles del Préstamo
                </Text>

                <Text>Cliente: {selectedLoan.debtor_name}</Text>
                <Text>Monto Original: ${selectedLoan.original_amount}</Text>
                <Text>Restante: ${selectedLoan.remaining}</Text>
                <Text>Interés: {selectedLoan.interes}%</Text>
                <Text>Estado: {selectedLoan.status}</Text>
                {selectedLoan.note && <Text>Nota: {selectedLoan.note}</Text>}

                <TouchableOpacity
                  style={{
                    backgroundColor: "#ddd",
                    padding: 10,
                    marginTop: 20,
                    borderRadius: 10,
                    alignItems: "center",
                  }}
                  onPress={() => setModalVisible(false)}
                >
                  <Text>Cerrar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
