import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

interface LoanForm {
  debtor_name: string;
  interes:string;
  amount: string;
  payment_method: "efectivo" | "transferencia";
  note: string;
}

export default function LoansScreen() {
  const [form, setForm] = useState<LoanForm>({
    debtor_name: "",
    interes:"",
    amount: "",
    payment_method: "efectivo",
    note: "",
  });

  const [loading, setLoading] = useState(false);

  const updateField = <K extends keyof LoanForm>(key: K, value: LoanForm[K]) => {
    setForm({ ...form, [key]: value });
  };

  const createLoan = async () => {
    if (!form.debtor_name || !form.amount) {
      Alert.alert("Error", "El nombre y el monto son obligatorios.");
      return;
    }

    if (isNaN(Number(form.amount))) {
      Alert.alert("Error", "El monto debe ser un número válido.");
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

    const { error } = await supabase.from("loans").insert({
      owner_id: user.id,
      debtor_name: form.debtor_name,
      interes: Number(form.interes),
      original_amount: Number(form.amount),
      remaining: Number(form.amount),
      payment_method: form.payment_method,
      note: form.note,
    });

    setLoading(false);

    if (error) {
      Alert.alert("Error al registrar", error.message);
    } else {
      Alert.alert("Éxito", "Préstamo registrado correctamente.");
      setForm({
        debtor_name: "",
        amount: "",
        interes:"",
        payment_method: "efectivo",
        note: "",
      });
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
      <SafeAreaView>
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
          <Text>Nombre del cliente</Text>
          <TextInput
            value={form.debtor_name}
            placeholder="Ej: Juan Pérez"
            onChangeText={(v) => updateField("debtor_name", v)}
            style={styles.input}
          />

          {/* Monto */}
          <Text>Monto del préstamo</Text>
          <TextInput
            value={form.amount}
            placeholder="Ej: 150.00"
            keyboardType="numeric"
            onChangeText={(v) => updateField("amount", v)}
            style={styles.input}
          />

             {/* Interes */}
          <Text>Interes</Text>
          <TextInput
            value={form.interes}
            placeholder="Ej: 10%"
            keyboardType="numeric"
            onChangeText={(v) => updateField("interes", v)}
            style={styles.input}
          />

          {/* Método de pago */}
          <Text>Método de pago</Text>
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
          <Text>Nota (opcional)</Text>
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
            style={{
              backgroundColor: loading ? "#999" : "#0066FF",
              padding: 15,
              borderRadius: 10,
              alignItems: "center",
              marginTop: 10,
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            {loading && <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />}
            <Text
              style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}
            >
              Guardar Préstamo
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = {
  input: {
    borderWidth: 1,
    borderColor: "#bbb",
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
  },
};
