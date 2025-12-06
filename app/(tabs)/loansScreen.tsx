import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

interface LoanForm {
  debtor_name: string;
  interes: string;
  amount: string;
  payment_method: "efectivo" | "transferencia";
  note: string;
}

export default function LoansScreen() {
  const [form, setForm] = useState<LoanForm>({
    debtor_name: "",
    interes: "",
    amount: "",
    payment_method: "efectivo",
    note: "",
  });

  const [loading, setLoading] = useState(false);

  const updateField = <K extends keyof LoanForm>(key: K, value: LoanForm[K]) => {
    setForm({ ...form, [key]: value });
  };

  /** ***********************
   * CÁLCULO SOLO VISUAL (NO SE GUARDA)
   **************************/
  const calculatePreview = () => {
    const amount = Number(form.amount);
    const interes = Number(form.interes);

    if (isNaN(amount) || isNaN(interes)) return null;

    return amount + amount * (interes / 100);
  };

  /** ***********************
   * CREAR PRÉSTAMO (RPC REAL)
   **************************/
  const createLoan = async () => {
    if (!form.debtor_name || !form.amount) {
      Alert.alert("Error", "El nombre y el monto son obligatorios.");
      return;
    }

    if (isNaN(Number(form.amount))) {
      Alert.alert("Error", "El monto debe ser un número válido.");
      return;
    }

    if (isNaN(Number(form.interes))) {
      Alert.alert("Error", "El interés debe ser un número válido.");
      return;
    }

    setLoading(true);

    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user) {
      Alert.alert("Error", "No hay usuario autenticado.");
      setLoading(false);
      return;
    }

    // Llamada a la función RPC en supabase
    const { error } = await supabase.rpc("create_loan_with_interest", {
      p_owner_id: user.id,
      p_debtor_name: form.debtor_name,
      p_amount: Number(form.amount),
      p_interes: Number(form.interes),
      p_payment_method: form.payment_method,
      p_note: form.note || "",
    });

    setLoading(false);

    if (error) {
      Alert.alert("Error al registrar", error.message);
    } else {
      Alert.alert("Éxito", "Préstamo registrado correctamente.");
      setForm({
        debtor_name: "",
        amount: "",
        interes: "",
        payment_method: "efectivo",
        note: "",
      });
    }
  };

  /** ***********************
   * UI
   **************************/
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ padding: 20 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 20,
          }}
        >
          Registrar Préstamo
        </Text>

        {/* Nombre */}
        <Text style={styles.label}>Nombre del cliente</Text>
        <TextInput
          value={form.debtor_name}
          placeholder="Ej: Juan Pérez"
          onChangeText={(v) => updateField("debtor_name", v)}
          style={styles.input}
        />

        {/* Monto */}
        <Text style={styles.label}>Monto del préstamo</Text>
        <TextInput
          value={form.amount}
          placeholder="Ej: 150.00"
          keyboardType="numeric"
          onChangeText={(v) => updateField("amount", v)}
          style={styles.input}
        />

        {/* Interés */}
        <Text style={styles.label}>Interés (%)</Text>
        <TextInput
          value={form.interes}
          placeholder="Ej: 10"
          keyboardType="numeric"
          onChangeText={(v) => updateField("interes", v)}
          style={styles.input}
        />

        {/* Mostrar cálculo visual */}
        {calculatePreview() !== null && (
          <Text style={styles.preview}>
            Total con interés: {calculatePreview()?.toFixed(2)} USD
          </Text>
        )}

        {/* Método de pago */}
        <Text style={styles.label}>Método de pago</Text>
        <View style={{ flexDirection: "row", marginVertical: 10 }}>
          {["efectivo", "transferencia"].map((method) => (
            <TouchableOpacity
              key={method}
              onPress={() =>
                updateField("payment_method", method as LoanForm["payment_method"])
              }
              style={{
                padding: 10,
                borderRadius: 10,
                backgroundColor:
                  form.payment_method === method ? "#4CAF50" : "#eee",
                marginRight: 10,
              }}
            >
              <Text
                style={{
                  color: form.payment_method === method ? "#fff" : "#000",
                  fontWeight: "bold",
                  textTransform: "capitalize",
                }}
              >
                {method}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Nota */}
        <Text style={styles.label}>Nota (opcional)</Text>
        <TextInput
          value={form.note}
          placeholder="Ej: Cliente paga puntual..."
          onChangeText={(v) => updateField("note", v)}
          style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
          multiline
        />

        {/* Botón */}
        <TouchableOpacity
          onPress={createLoan}
          disabled={loading}
          style={styles.button}
        >
          {loading && (
            <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
          )}
          <Text style={styles.buttonText}>Guardar Préstamo</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = {
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#bbb",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  preview: {
    fontSize: 18,
    marginTop: -5,
    marginBottom: 15,
    fontWeight: "bold",
    color: "#0066FF",
  },
  button: {
    backgroundColor: "#0066FF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "center",
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
};
